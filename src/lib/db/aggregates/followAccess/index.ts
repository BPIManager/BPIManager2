import { db } from "@/lib/db";
import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * `follows`（フォロー関係）と`followApprovalNotifications`（承認記録）を
 * 横断して「承認済みフォローによる閲覧許可があるか」を判定するリポジトリ。
 *
 * `follows`ドメイン・`followApprovalNotifications`ドメインいずれの
 * 責務でもないクロスドメイン参照のためここに置く。
 */
class FollowAccessAggregateRepository {
  /**
   * 承認済みフォローによる閲覧許可があるかを判定する。
   *
   * `follows`行の存在だけでは判定できない。承認制導入前（対象が公開
   * だった時代）に成立したフォローは`follows`行こそ残るが、承認記録
   * (`followApprovalNotifications`)を持たないため、`follows`行の存在
   * のみで閲覧許可を与えると「後から非公開に変更したユーザーの、
   * 未承認の既存フォロワーが閲覧できてしまう」問題が起きる。
   * このため両方の存在を要求する。
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
   * 対象ユーザー宛の、承認記録を持たない既存フォロワー（＝承認制導入前、
   * 対象が公開だった時代に成立したフォロー）を、フォロワーの表示情報付きで
   * 取得する。
   *
   * 実データの`followRequests`行は作らず、常にこの2テーブルの差分から
   * 動的に導出する（マイグレーションでの一括レコード挿入を避けるため）。
   * 通知ベルの「承認待ち」タブで、本物の`followRequests`と統合して
   * 「未承認フォロワー」として提示し、対象ユーザー本人に事後承認/
   * 強制解除（実質の却下）を促す。
   *
   * @param targetUserId - 対象ユーザー ID
   */
  async listUnapprovedFollowers(targetUserId: string) {
    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "u.userId", "f.followerId")
      .select(["f.createdAt", "u.userId as followerId", "u.userName as followerName", "u.profileImage as followerImage"])
      .where("f.followingId", "=", targetUserId)
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
   *
   * @param targetUserId - 対象ユーザー ID
   */
  async countUnapprovedFollowers(targetUserId: string): Promise<number> {
    const result = await db
      .selectFrom("follows as f")
      .select((eb) => eb.fn.countAll<number>().as("cnt"))
      .where("f.followingId", "=", targetUserId)
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
