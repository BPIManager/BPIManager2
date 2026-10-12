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
   * 承認済みのフォロワー（follows と承認記録の両方がある）を、直近の承認日時の新しい順で返す。
   * 閲覧権限の管理画面の「承認済み」一覧に使う。承認記録が複数行ある場合は最新の承認日時を採る。
   *
   * @param targetUserId - 対象（承認した側）のユーザー ID
   */
  async listApprovedFollowers(targetUserId: string) {
    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "u.userId", "f.followerId")
      .innerJoin("followApprovalNotifications as fan", (join) =>
        join
          .onRef("fan.recipientId", "=", "f.followerId")
          .onRef("fan.actorId", "=", "f.followingId"),
      )
      .select([
        "u.userId as followerId",
        "u.userName as followerName",
        "u.profileImage as followerImage",
        "f.createdAt as followedAt",
        (eb) => eb.fn.max("fan.createdAt").as("approvedAt"),
      ])
      .where("f.followingId", "=", targetUserId)
      .groupBy([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "f.createdAt",
      ])
      .orderBy("approvedAt", "desc")
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
