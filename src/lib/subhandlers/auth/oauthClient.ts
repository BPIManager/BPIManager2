import type { NextApiRequest } from "next";
import crypto from "crypto";
import { oauthRepo } from "@/lib/db/domains/oauth";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { manageClientSchema } from "@/schemas/oauth";
import { authUidOf, type HandleOutcome } from "./_shared";

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

