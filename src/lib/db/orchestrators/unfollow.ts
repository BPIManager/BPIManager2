import { db } from "@/lib/db";
import { followsRepo } from "@/lib/db/domains/follow";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";

/**
 * フォローを解除し、解除した相手を`followerId`本人の全リストからも
 * 同一トランザクションで外す。
 *
 * リストへの追加は「フォロー中であること」を前提にしているため
 * （追加APIは`followsRepo.isFollowing`で確認済み）、フォロー解除後も
 * `followListMembers`の行が残ると、フォローしていないユーザーが
 * リストのメンバー数に数えられ続ける孤立データになる。単純な
 * `followsRepo.remove`呼び出しに代えてこのオーケストレーターを使う。
 *
 * @param followerId - フォローを解除する側のユーザー ID
 * @param followingId - フォロー解除対象のユーザー ID
 * @returns フォロー関係が実際に存在し削除された場合は `true`
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
    return true;
  });
}
