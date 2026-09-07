import type { NextApiRequest } from "next";
import crypto from "crypto";
import { apiKeysRepo } from "@/lib/db/domains/apiKeys";
import { oauthRepo } from "@/lib/db/domains/oauth";
import { usersRepo } from "@/lib/db/domains/users";
import { followsRepo } from "@/lib/db/domains/follow";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { submitFollowRequest } from "@/lib/db/orchestrators/followRequestSubmission";
import { adminAuth } from "@/lib/firebase/admin";
import { timingSafeEqual } from "@/utils/common/timingSafeEqual";
import { validateUserName } from "@/utils/common/nameValidation";
import { authenticateViewer } from "@/middlewares/api/withApi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { manageClientSchema } from "@/schemas/oauth";
import { followRequestSubmitSchema } from "@/schemas/followRequests/submit";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * auth 系（`apiKey` / `oauthClient` / `token` / `invite/[token]` /
 * `usernames/[username]/availability` / トップレベル `follow-requests/**`）の
 * subhandler 群。ユーザースコープ外。`HandlerResult` を返し v1/v2 で共有する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}

/* ------------------------------ apiKey.ts ------------------------------ */

/** GET /apiKey */
export async function handleGetApiKey(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const record = await apiKeysRepo.findByUserId(uid);
    return {
      result: ok({
        exists: !!record,
        key: record ? `****${record.key.slice(-4)}` : null,
      }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** PUT /apiKey */
export async function handleRegenerateApiKey(
  req: NextApiRequest,
): Promise<HandleOutcome<{ key: string }>> {
  const uid = authUidOf(req);
  try {
    const newKey = crypto.randomBytes(32).toString("hex");
    await apiKeysRepo.upsert(uid, newKey);
    return { result: ok({ key: newKey }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* ---------------------------- oauthClient.ts ---------------------------- */

/** GET /oauthClient */
export async function handleGetOauthClient(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const client = await oauthRepo.findClientByUserId(uid);
    return {
      result: ok({
        exists: !!client,
        clientId: client?.clientId ?? null,
        maskedSecret: client?.clientSecret
          ? `****${client.clientSecret.slice(-4)}`
          : null,
        redirectUris: client?.redirectUris ?? null,
      }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** PUT /oauthClient */
export async function handleUpsertOauthClient(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const parsed = manageClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const clientId = crypto.randomBytes(16).toString("hex");
    const clientSecret = crypto.randomBytes(32).toString("hex");
    await oauthRepo.upsertUserClient({
      userId: uid,
      clientId,
      clientSecret,
      redirectUris: parsed.data.redirect_uris,
    });
    return {
      result: ok({
        clientId,
        clientSecret,
        redirectUris: parsed.data.redirect_uris,
      }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** DELETE /oauthClient （v1 は 204） */
export async function handleDeleteOauthClient(
  req: NextApiRequest,
): Promise<HandleOutcome<{ deleted: true }>> {
  const uid = authUidOf(req);
  try {
    await oauthRepo.deleteClientByUserId(uid);
    return {
      result: ok({ deleted: true }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* ------------------------------ token.ts ------------------------------ */

/** POST /token （X-API-Key → Custom Token。公開・withRateLimit） */
export async function handleTokenExchange(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const xApiKey = req.headers["x-api-key"];
  if (!xApiKey || typeof xApiKey !== "string") {
    return { result: err(401, "API Key is required"), ...base };
  }
  try {
    const keyRecord = await apiKeysRepo.findByKey(xApiKey);
    if (!keyRecord || !timingSafeEqual(xApiKey, keyRecord.key)) {
      return { result: err(401, "Invalid API Key"), ...base };
    }
    const customToken = await adminAuth.createCustomToken(keyRecord.userId);
    return {
      result: ok({ customToken, expiresIn: 3600 }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* --------------------------- invite/[token].ts --------------------------- */

/** GET /invite/[token] （公開・withRateLimit） */
export async function handleResolveInvite(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const { token } = req.query;
  const base = { targetUserId: "", viewerId: null as string | null };
  if (!token || typeof token !== "string") {
    return { result: err(400, "Invalid token"), ...base };
  }
  try {
    const followInvite = await followInviteLinksRepo.getByToken(token);
    if (!followInvite) {
      return { result: err(404, "Invalid invite link"), ...base };
    }
    const inviter = await usersRepo.getDisplayInfo(followInvite.userId);
    if (!inviter) {
      return { result: err(404, "User not found"), ...base };
    }

    const viewerId = (await authenticateViewer(req)) ?? null;
    let isFollowing = false;
    let hasPendingRequest = false;
    if (viewerId && viewerId !== inviter.userId) {
      [isFollowing, hasPendingRequest] = await Promise.all([
        inviter.isPublic
          ? followsRepo.isFollowing(viewerId, inviter.userId)
          : followAccessAggregateRepo.hasApprovedFollowAccess(
              viewerId,
              inviter.userId,
            ),
        followRequestsRepo.existsPending(viewerId, inviter.userId),
      ]);
    }

    return {
      result: ok({
        type: "follow" as const,
        userId: inviter.userId,
        userName: inviter.userName,
        profileImage: inviter.profileImage,
        isFollowing,
        hasPendingRequest,
      }),
      targetUserId: inviter.userId,
      viewerId,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* ---------------- usernames/[username]/availability.ts ---------------- */

/** GET /usernames/[username]/availability （withAuth） */
export async function handleUsernameAvailability(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  const userName = String(req.query.username);

  const validation = validateUserName(userName);
  if (!validation.isValid) {
    return {
      result: ok({ available: false, message: validation.message }),
      ...base,
    };
  }
  try {
    const existingUser = await usersRepo.checkUserNameAvailability(userName);
    return {
      result: ok({
        available: !existingUser,
        message: existingUser
          ? "この名前は既に使用されています"
          : "使用可能な名前です",
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* -------------------- follow-requests (top-level) -------------------- */

/** POST /follow-requests （招待トークンでリクエスト送信。v1 requested は 201） */
export async function handleSubmitFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown> & { successStatus: number }> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid, successStatus: 200 };

  const parsed = followRequestSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      ...base,
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
    };
  }
  try {
    const result = await submitFollowRequest(uid, parsed.data.token);
    switch (result.status) {
      case "requested":
        return { ...base, result: ok({ status: "requested" }), successStatus: 201 };
      case "followed":
        return { ...base, result: ok({ status: "followed" }) };
      case "self":
        return { ...base, result: err(400, "You cannot follow yourself") };
      case "invalid_token":
        return { ...base, result: err(404, "Invalid invite link") };
      case "target_not_found":
        return { ...base, result: err(404, "User not found") };
    }
    return { ...base, result: err(500, "Internal Server Error") };
  } catch (error: unknown) {
    return { ...base, result: err(500, toErrorMessage(error)) };
  }
}

/** DELETE /follow-requests/[targetUserId] （送信済みリクエストの取り下げ） */
export async function handleWithdrawFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<{ withdrawn: boolean }>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  const { targetUserId } = req.query;
  if (!targetUserId || typeof targetUserId !== "string") {
    return { result: err(400, "Invalid targetUserId"), ...base };
  }
  try {
    const withdrawn = await followRequestsRepo.withdraw(uid, targetUserId);
    return { result: ok({ withdrawn }), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
