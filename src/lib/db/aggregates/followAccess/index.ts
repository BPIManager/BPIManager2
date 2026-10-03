import { db } from "@/lib/db";
import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * follows と followApprovalNotifications を横断して、承認済みフォローによる閲覧許可の有無を判定する。
 * どちらのドメインにも属さないクロスドメイン参照のためここに置く。
 */
class FollowAccessAggregateRepository {
  /**
   * 承認済みフォローによる閲覧許可の有無を判定する。follows だけでは判定せず、承認記録も要求する。
   * 承認記録の無い既存フォローは、対象が後から非公開になった場合に閲覧許可を与えないため。
   *
   * @param followerId - フォローしている側（閲覧者）のユーザー ID
   * @param targetUserId - フォローされている側（対象）のユーザー ID
   */
  async hasApprovedFollowAccess(
    followerId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const isFollowing = await followsRepo.isFollowing(followerId, targetUserId);
    if (!isFollowing) return false;

    return await followApprovalNotificationsRepo.existsForPair(
      followerId,
      targetUserId,
    );
  }

  /**
   * 対象ユーザーが非公開の場合のみ、承認記録を持たない既存フォロワーを表示情報付きで返す。
   * 実行時に2テーブルの差分から導出し、followRequests 行は作らない（一括挿入を避けるため）。
   *
   * @param targetUserId - 対象ユーザー ID
   */
  async listUnapprovedFollowers(targetUserId: string) {
    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "u.userId", "f.followerId")
      .innerJoin("users as target", "target.userId", "f.followingId")
      .select(["f.createdAt", "u.userId as followerId", "u.userName as followerName", "u.profileImage as followerImage"])
      .where("f.followingId", "=", targetUserId)
      .where("target.isPublic", "=", 0)
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom("followApprovalNotifications as fan")
              .select("fan.id")
              .whereRef("fan.recipientId", "=", "f.followerId")
              .where("fan.actorId", "=", targetUserId),
          ),
        ),
      )
      .orderBy("f.createdAt", "asc")
      .execute();
  }

  /**
   * {@link listUnapprovedFollowers}の件数版。通知バッジの「承認待ち件数」に使う。
   * 同様に対象ユーザーが現在非公開の場合のみカウントする。
   *
   * @param targetUserId - 対象ユーザー ID
   */
  async countUnapprovedFollowers(targetUserId: string): Promise<number> {
    const result = await db
      .selectFrom("follows as f")
      .innerJoin("users as target", "target.userId", "f.followingId")
      .select((eb) => eb.fn.countAll<number>().as("cnt"))
      .where("f.followingId", "=", targetUserId)
      .where("target.isPublic", "=", 0)
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom("followApprovalNotifications as fan")
              .select("fan.id")
              .whereRef("fan.recipientId", "=", "f.followerId")
              .where("fan.actorId", "=", targetUserId),
          ),
        ),
      )
      .executeTakeFirst();

    return Number(result?.cnt ?? 0);
  }
}

export const followAccessAggregateRepo = new FollowAccessAggregateRepository();
