import { db } from "@/lib/db";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * フォロワーの閲覧権限だけを取り消す。フォロー関係(follows)は残し、承認記録を同じ組の全行削除する。
 * 取り消した相手は「承認待ち」の状態に戻り、本人側から再承認できる。
 *
 * @param followerId - 閲覧権限を取り消す相手（フォロワー）のユーザー ID
 * @param targetUserId - 取り消しを行う（承認していた）ユーザー ID
 * @returns 承認記録が実際に削除された場合は true（承認済みでなければ false）
 */
export async function revokeViewPermission(
  followerId: string,
  targetUserId: string,
): Promise<boolean> {
  const deleted = await db
    .transaction()
    .execute((trx) =>
      followApprovalNotificationsRepo.deleteForPair(trx, followerId, targetUserId),
    );
  return deleted > 0;
}
