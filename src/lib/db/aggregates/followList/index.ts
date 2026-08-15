import { db } from "@/lib/db";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";
import { canViewUserData, wherePublicOnly } from "@/lib/db/shared/visibility";

/**
 * フォロー中/フォロワー一覧を、プロフィール表示用の複合データ
 * （`users`の表示カラム・`userStatusLogs`の最新totalBpi・
 * `officialArenaStats`の最新arenaClass・閲覧者からのフォロー状態）と
 * 結合して組み立てるリポジトリクラス。
 *
 * `follows`ドメイン本来の責務（フォロー関係の読み書き）を超えた
 * クロスドメイン参照のため、`domains/follow`ではなくここに置く。
 */
class FollowListAggregateRepository {
  /**
   * フォロー中の公開ユーザー一覧を取得する（ライバル選択・月次レビュー集計用の軽量版）。
   *
   * ページネーションなし。非公開ユーザーは除外する。
   *
   * 呼び出し元は`userId`本人ではなく第三者が閲覧するケースがあるため
   * （例: `checkUserAccess`で`userId`のプロフィール閲覧権を確認した別の
   * 閲覧者がここを呼ぶ）、「`follows`が存在する = 閲覧者本人に閲覧許可がある」
   * という判定（#275, `wherePublicOnly`除去）は使えない。`userId`が
   * フォローしている非公開ユーザーの閲覧許可は`userId`本人にしかないため、
   * 引き続きisPublicで一律除外する。
   *
   * @param userId - フォローしている側のユーザー ID
   */
  async getPublicFollowingUsers(userId: string) {
    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .select(["u.userId", "u.userName", "u.profileImage"])
      .where("f.followerId", "=", userId)
      .$call((qb) => wherePublicOnly(qb, "u.isPublic"))
      .orderBy("u.userName", "asc")
      .execute();
  }

  /**
   * フォロー中またはフォロワーのユーザー一覧をページネーション付きで取得する。
   *
   * 非公開ユーザーは情報をマスクして返す。
   *
   * @param params.targetUserId - 一覧を取得する対象ユーザーの ID
   * @param params.viewerId - 閲覧者の ID（フォロー状態の判定に使用）
   * @param params.type - `"following"`: フォロー中、`"followers"`: フォロワー
   * @param params.version - 総合BPI・アリーナクラスを取得する対象バージョン
   * @param params.page - ページ番号（1 始まり）
   * @param params.limit - 1 ページあたりの件数
   * @returns ユーザーリスト・総件数・続きがあるかどうか
   */
  async getFollowList(params: {
    targetUserId: string;
    viewerId?: string;
    type: "following" | "followers";
    version: string;
    page: number;
    limit: number;
  }) {
    const { targetUserId, viewerId, type, version, page, limit } = params;
    const offset = (page - 1) * limit;

    const joinCol = type === "following" ? "followingId" : "followerId";
    const whereCol = type === "following" ? "followerId" : "followingId";

    const query = db
      .selectFrom("follows as f")
      .innerJoin("users as u", `u.userId`, `f.${joinCol}`)
      .where(`f.${whereCol}`, "=", targetUserId);

    const countRes = await query
      .select((eb) => eb.fn.count<number>("f.id").as("total"))
      .executeTakeFirst();
    const totalCount = Number(countRes?.total ?? 0);

    const users = await query
      .select([
        ...userDisplayColumns("u"),
        "u.profileText",
        "f.createdAt as followedAt",
      ])
      .select((eb) => [
        eb
          .selectFrom("userStatusLogs as usl")
          .select("usl.totalBpi")
          .whereRef("usl.userId", "=", "u.userId")
          .where("usl.version", "=", version)
          .orderBy("usl.id", "desc")
          .limit(1)
          .as("totalBpi"),
        eb
          .selectFrom("officialArenaStats as oas")
          .select("oas.arenaClass")
          .whereRef("oas.userId", "=", "u.userId")
          .where("oas.version", "=", version)
          .orderBy("oas.id", "desc")
          .limit(1)
          .as("arenaClass"),
        eb
          .selectFrom("follows as f2")
          .select((eb2) => [eb2.fn.countAll<number>().as("cnt")])
          .whereRef("f2.followingId", "=", "u.userId")
          .where("f2.followerId", "=", viewerId ?? "")
          .as("isViewerFollowing"),
      ])
      .orderBy("f.createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();
    return {
      users: users.map((u) => {
        const isSelf = u.userId === viewerId;
        const shouldMask = !canViewUserData({
          viewerId,
          targetUserId: u.userId,
          isPublic: u.isPublic,
          hasFollowAccess: Number(u.isViewerFollowing) > 0,
        });

        return {
          ...u,
          userId: shouldMask ? "" : u.userId,
          userName: shouldMask ? "非公開ユーザー" : u.userName,
          profileImage: shouldMask ? null : u.profileImage,
          profileText: shouldMask ? "" : u.profileText,
          totalBpi: shouldMask ? null : u.totalBpi ? Number(u.totalBpi) : null,
          arenaClass: shouldMask ? null : u.arenaClass,

          isSelf,
          isViewerFollowing: Number(u.isViewerFollowing) > 0,
          isPublic: Number(u.isPublic) === 1,
          isMasked: shouldMask,
        };
      }),
      totalCount,
      hasMore: offset + users.length < totalCount,
    };
  }
}

export const followListAggregateRepo = new FollowListAggregateRepository();
