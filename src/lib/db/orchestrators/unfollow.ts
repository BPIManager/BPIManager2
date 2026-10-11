import { db } from "@/lib/db";
import { followsRepo } from "@/lib/db/domains/follow";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * フォローを解除し、解除相手を followerId 本人の全リストからも、閲覧の承認記録も同一トランザクションで外す。
 * リスト追加はフォロー中を前提とするため、残すと非フォローのユーザーがメンバー数に数えられ続ける孤立データになる。
 * 承認記録を残すと、相手が公開期間中に再フォローして後から非公開に戻したとき、再承認なしで閲覧許可が復活する。
 *
 * @param followerId - フォローを解除する側のユーザー ID
 * @param followingId - フォロー解除対象のユーザー ID
 * @returns フォロー関係が実際に存在し削除された場合は true
 */
export async function unfollowAndCleanupLists(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  return await db.transaction().execute(async (trx) => {
    const removed = await followsRepo.removeInTransaction(
      trx,
      followerId,
      followingId,
    );
    if (!removed) return false;

    await followListMembersRepo.deleteByFollowingForOwner(
      trx,
      followerId,
      followingId,
    );
    await followApprovalNotificationsRepo.deleteForPair(
      trx,
      followerId,
      followingId,
    );
    return true;
  });
}
