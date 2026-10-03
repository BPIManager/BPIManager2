import { db } from "@/lib/db";

/**
 * フォローリクエストを送信者の表示情報と結合して組み立てる。domains/followRequests の責務を超えるためここに置く。
 */
class FollowRequestsAggregateRepository {
  /**
   * 指定ユーザー宛の保留中フォローリクエストを送信者の表示情報付きで取得する。通知ベルの一覧用のため件数は上限で打ち切る。
   * 未読バッジは countPendingForTarget を別途使うため、この打ち切りの影響を受けない。
   *
   * @param targetUserId - リクエスト先ユーザー ID
   */
  async listPendingForTarget(targetUserId: string) {
    return await db
      .selectFrom("followRequests as fr")
      .innerJoin("users as u", "u.userId", "fr.requesterId")
      .select([
        "fr.id",
        "fr.createdAt",
        "u.userId as requesterId",
        "u.userName as requesterName",
        "u.profileImage as requesterImage",
      ])
      .where("fr.targetUserId", "=", targetUserId)
      .orderBy("fr.createdAt", "asc")
      .limit(200)
      .execute();
  }
}

export const followRequestsAggregateRepo = new FollowRequestsAggregateRepository();
