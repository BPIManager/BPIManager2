import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * フォロー関係（`follows` テーブル）の参照・更新を担当するリポジトリクラス。
 */
class FollowRepository {
  /**
   * 指定ユーザーが別のユーザーをフォローしているか確認する。
   *
   * @param followerId - フォローする側のユーザー ID
   * @param followingId - フォローされる側のユーザー ID
   * @returns フォロー済みであれば `true`
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .selectFrom("follows")
      .select("id")
      .where("followerId", "=", followerId)
      .where("followingId", "=", followingId)
      .executeTakeFirst();

    return !!result;
  }

  /**
   * フォロー状態をトグルする。存在すれば削除し、なければ追加する。
   *
   * @param followerId - フォローする側のユーザー ID
   * @param followingId - フォローされる側のユーザー ID
   * @returns フォローした場合は `true`、解除した場合は `false`
   */
  async toggleFollow(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    return await db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom("follows")
        .select("id")
        .where("followerId", "=", followerId)
        .where("followingId", "=", followingId)
        .forUpdate()
        .executeTakeFirst();

      if (existing) {
        await trx.deleteFrom("follows").where("id", "=", existing.id).execute();
        return false;
      } else {
        await trx
          .insertInto("follows")
          .values({
            followerId,
            followingId,
          })
          .execute();
        return true;
      }
    });
  }

  /**
   * 指定ユーザーのフォロワー数とフォロー中数を取得する。
   *
   * @param userId - ユーザー ID
   * @returns `{ followersCount, followingCount }`
   */
  async getFollowCounts(userId: string) {
    const [followers, following] = await Promise.all([
      db
        .selectFrom("follows")
        .select((eb) => eb.fn.count<number>("id").as("count"))
        .where("followingId", "=", userId)
        .executeTakeFirst(),
      db
        .selectFrom("follows")
        .select((eb) => eb.fn.count<number>("id").as("count"))
        .where("followerId", "=", userId)
        .executeTakeFirst(),
    ]);

    return {
      followersCount: Number(followers?.count ?? 0),
      followingCount: Number(following?.count ?? 0),
    };
  }

  /**
   * フォロー中またはフォロワーのユーザー一覧をページネーション付きで取得する。
   *
   * 非公開ユーザーは情報をマスクして返す。
   *
   * @param params.targetUserId - 一覧を取得する対象ユーザーの ID
   * @param params.viewerId - 閲覧者の ID（フォロー状態の判定に使用）
   * @param params.type - `"following"`: フォロー中、`"followers"`: フォロワー
   * @param params.page - ページ番号（1 始まり）
   * @param params.limit - 1 ページあたりの件数
   * @returns ユーザーリスト・総件数・続きがあるかどうか
   */
  async getFollowList(params: {
    targetUserId: string;
    viewerId?: string;
    type: "following" | "followers";
    page: number;
    limit: number;
  }) {
    const { targetUserId, viewerId, type, page, limit } = params;
    const offset = (page - 1) * limit;

    const joinCol = type === "following" ? "followingId" : "followerId";
    const whereCol = type === "following" ? "followerId" : "followingId";

    const query = db
      .selectFrom("follows as f")
      .innerJoin("users as u", `u.userId`, `f.${joinCol}`)
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("userStatusLogs")
            .select(["userId as usl_userId", "totalBpi", "arenaRank"])
            .where("id", "in", (eb) =>
              eb
                .selectFrom("userStatusLogs as sub")
                .select([eb.fn.max(sql<number>`sub.id`).as("maxId")])
                .groupBy("sub.userId"),
            )
            .as("latestStatus"),
        (join) => join.onRef("latestStatus.usl_userId", "=", `u.userId`),
      )
      .where(`f.${whereCol}`, "=", targetUserId);

    const countRes = await query
      .select((eb) => eb.fn.count<number>("f.id").as("total"))
      .executeTakeFirst();
    const totalCount = Number(countRes?.total ?? 0);

    const users = await query
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.profileText",
        "u.isPublic",
        "latestStatus.totalBpi",
        "latestStatus.arenaRank",
        "f.createdAt as followedAt",
      ])
      .select((eb) => [
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
        const shouldMask = Number(u.isPublic) !== 1 && !isSelf;

        return {
          ...u,
          userId: shouldMask ? "" : u.userId,
          userName: shouldMask ? "非公開ユーザー" : u.userName,
          profileImage: shouldMask ? null : u.profileImage,
          profileText: shouldMask ? "" : u.profileText,
          totalBpi: shouldMask ? null : u.totalBpi ? Number(u.totalBpi) : null,
          arenaRank: shouldMask ? null : u.arenaRank,

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

export const followsRepo = new FollowRepository();
