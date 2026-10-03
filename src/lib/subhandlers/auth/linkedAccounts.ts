import type { NextApiRequest } from "next";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";
import { err, ok } from "@/middlewares/api/apiResult";
import { hashEmail, isValidEmail, normalizeEmail } from "@/lib/auth/emailHash";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import {
  deleteProviderFromUser,
  sendEmailChangeLink,
  sendEmailSignInLink,
} from "@/lib/firebase/identityToolkit";
import { userEmailHashesRepo } from "@/lib/db/domains/userEmailHashes";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";
import { mapIdentityToolkitError } from "./_errors";
import { emailLinkContinueUrl } from "./emailLogin";

/** 連携解除・表示の対象にするログインプロバイダ。Firebase の providerId と一致させる。 */
export const LINKABLE_PROVIDER_IDS = [
  "google.com",
  "twitter.com",
  "oidc.line",
  "password",
] as const;

export interface LinkedAccount {
  providerId: string;
  /** password（メールアドレス）のみ値を持つ。SNS 連携は表示名等を返さない */
  email: string | null;
}

const EMAIL_PROVIDER_ID = "password";

function toLinkedAccounts(user: UserRecord): LinkedAccount[] {
  return user.providerData
    .filter((p) => (LINKABLE_PROVIDER_IDS as readonly string[]).includes(p.providerId))
    .map((p) => ({
      providerId: p.providerId,
      email: p.providerId === EMAIL_PROVIDER_ID ? (user.email ?? null) : null,
    }));
}

/**
 * Firebase 上のメールアドレス連携状態を DB のハッシュへ反映する（Firebase を正とする）。
 * 別ユーザーが同じハッシュを保持している場合は上書きしない（Firebase 側の一意性と食い違う異常系）。
 */
async function syncEmailHash(uid: string, user: UserRecord): Promise<void> {
  const hasEmailProvider = user.providerData.some((p) => p.providerId === EMAIL_PROVIDER_ID);
  if (!hasEmailProvider || !user.email) {
    await userEmailHashesRepo.deleteByUserId(uid);
    return;
  }

  const emailHash = hashEmail(user.email);
  const owner = await userEmailHashesRepo.findUserIdByHash(emailHash);
  if (owner && owner.userId !== uid) return;
  await userEmailHashesRepo.upsert(uid, emailHash);
}

/** 指定メールアドレスを Firebase で既に使用している uid を返す（未使用なら null）。 */
async function findUidByEmail(email: string): Promise<string | null> {
  try {
    return (await adminAuth.getUserByEmail(email)).uid;
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "auth/user-not-found") return null;
    throw error;
  }
}

function bearerTokenOf(req: NextApiRequest): string {
  return (req.headers.authorization ?? "").split("Bearer ")[1] ?? "";
}

/** GET /api/v2/auth/linked-accounts: 連携中のログイン手段を返し、メールハッシュを同期する */
export async function handleListLinkedAccounts(
  req: NextApiRequest,
): Promise<HandleOutcome<{ accounts: LinkedAccount[] }>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  try {
    const user = await adminAuth.getUser(uid);
    await syncEmailHash(uid, user);
    return { result: ok({ accounts: toLinkedAccounts(user) }), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/**
 * POST /api/v2/auth/linked-accounts/email: メールアドレスを追加（未連携）または変更（連携済み）する確認メールを送る。
 * 紐付けはリンクを開いた時点で完了する（送信だけでは Firebase 上のアドレスは変わらない）。
 */
export async function handleRequestEmailLink(
  req: NextApiRequest,
): Promise<HandleOutcome<{ sent: true }>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  const { email, turnstileToken } = (req.body ?? {}) as {
    email?: unknown;
    turnstileToken?: unknown;
  };

  if (typeof email !== "string" || !isValidEmail(email)) {
    return { result: err(400, "メールアドレスの形式が正しくありません"), ...base };
  }

  const verified = await verifyTurnstileToken(
    typeof turnstileToken === "string" ? turnstileToken : "",
  );
  if (!verified) {
    return { result: err(403, "ボット確認に失敗しました。再度お試しください"), ...base };
  }

  const normalized = normalizeEmail(email);
  try {
    const user = await adminAuth.getUser(uid);
    const hasEmailProvider = user.providerData.some((p) => p.providerId === EMAIL_PROVIDER_ID);

    if (hasEmailProvider && user.email === normalized) {
      return { result: err(409, "このメールアドレスは既に連携されています"), ...base };
    }

    const owner = await userEmailHashesRepo.findUserIdByHash(hashEmail(normalized));
    if (owner && owner.userId !== uid) {
      return { result: err(409, "このメールアドレスは既に使用されています"), ...base };
    }
    const takenUid = await findUidByEmail(normalized);
    if (takenUid && takenUid !== uid) {
      return { result: err(409, "このメールアドレスは既に使用されています"), ...base };
    }

    if (hasEmailProvider) {
      await sendEmailChangeLink(bearerTokenOf(req), normalized, emailLinkContinueUrl("change"));
    } else {
      await sendEmailSignInLink(normalized, emailLinkContinueUrl("link"));
    }
    return { result: ok({ sent: true as const }), ...base };
  } catch (error: unknown) {
    return { result: mapIdentityToolkitError(error), ...base };
  }
}

/**
 * DELETE /api/v2/auth/linked-accounts/[providerId]: ログイン手段を連携解除する。
 * 残りが0件になる解除は拒否する（SNS を全て外せるのはメールアドレス連携済みの場合のみ、という仕様もこれで満たされる）。
 */
export async function handleUnlinkProvider(
  req: NextApiRequest,
  providerId: string,
): Promise<HandleOutcome<{ removed: string }>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };

  if (!(LINKABLE_PROVIDER_IDS as readonly string[]).includes(providerId)) {
    return { result: err(400, "不明なログイン手段です"), ...base };
  }

  try {
    const user = await adminAuth.getUser(uid);
    const providerIds = user.providerData.map((p) => p.providerId);
    if (!providerIds.includes(providerId)) {
      return { result: err(404, "連携されていないログイン手段です"), ...base };
    }
    if (providerIds.length <= 1) {
      return { result: err(409, "最後のログイン手段は削除できません"), ...base };
    }

    await deleteProviderFromUser(uid, providerId);
    if (providerId === EMAIL_PROVIDER_ID) {
      await userEmailHashesRepo.deleteByUserId(uid);
    }
    return { result: ok({ removed: providerId }), ...base };
  } catch (error: unknown) {
    return { result: mapIdentityToolkitError(error), ...base };
  }
}
