import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { userEmailHashesRepo } from "@/lib/db/domains/userEmailHashes";
import { adminAuth } from "@/lib/firebase/admin";
import { deleteProviderFromUser } from "@/lib/firebase/identityToolkit";
import { EMAIL_PROVIDER_ID } from "@/types/auth/linkedAccounts";

export type RemoveProviderOutcome =
  | { ok: true }
  | { ok: false; status: 404 | 409; message: string };

/**
 * ログイン手段を連携解除する。ユーザー行のロックを取ったトランザクション内で「残件の確認 → 解除 → ハッシュ削除」を行い、
 * 同時の解除リクエストが両方とも「残り2件」と判定して0件になることを防ぐ。
 *
 * @param uid - 対象ユーザーの Firebase uid（BPIM の userId と同一）
 * @param providerId - 解除する providerId
 */
export async function removeLinkedProvider(
  uid: string,
  providerId: string,
): Promise<RemoveProviderOutcome> {
  return await db.transaction().execute(async (trx) => {
    await lockUserForWrite(trx, uid);

    const user = await adminAuth.getUser(uid);
    const providerIds = user.providerData.map((p) => p.providerId);
    if (!providerIds.includes(providerId)) {
      return { ok: false, status: 404, message: "連携されていないログイン手段です" } as const;
    }
    if (providerIds.length <= 1) {
      return { ok: false, status: 409, message: "最後のログイン手段は削除できません" } as const;
    }

    await deleteProviderFromUser(uid, providerId);
    if (providerId === EMAIL_PROVIDER_ID) {
      await userEmailHashesRepo.deleteByUserId(uid, trx);
    }
    return { ok: true } as const;
  });
}
