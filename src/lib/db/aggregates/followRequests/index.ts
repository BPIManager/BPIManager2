import { db } from "@/lib/db";

/**
 * フォローリクエストを、送信者のプロフィール表示用データと結合して
 * 組み立てるリポジトリクラス。
 *
 * `followRequests`ドメイン本来の責務（リクエストの読み書き）を超えた
 * クロスドメイン参照のため、`domains/followRequests`ではなくここに置く。
 */
class FollowRequestsAggregateRepository {
  /**
   * 指定ユーザー宛の保留中フォローリクエストを、送信者の表示情報付きで取得する。
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
      .execute();
  }
}

export const followRequestsAggregateRepo = new FollowRequestsAggregateRepository();
