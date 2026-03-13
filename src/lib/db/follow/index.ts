import { db } from "@/lib/db";
import { sql } from "kysely";

class FollowRepository {
  /**
   * フォロー状態を確認する
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
   * フォロー状態をトグルする
   * @returns true: フォローした, false: 解除した
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
   * フォロワー数を取得する
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
   * フォロー・フォロワー取得
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
        "latestStatus.totalBpi",
        "latestStatus.arenaRank",
        "f.createdAt as followedAt",
      ])
      .select((eb) => [
        eb
          .selectFrom("follows as f2")
          .select([eb.fn.count<number>(sql`f2.id`).as("cnt")])
          .whereRef("f2.followingId", "=", "u.userId")
          .where("f2.followerId", "=", viewerId ?? "")
          .as("isViewerFollowing"),
      ])
      .orderBy("f.createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      users: users.map((u) => ({
        ...u,
        isSelf: u.userId === viewerId,
        totalBpi: u.totalBpi ? Number(u.totalBpi) : null,
        isViewerFollowing: Number(u.isViewerFollowing) > 0,
      })),
      totalCount,
      hasMore: offset + users.length < totalCount,
    };
  }
}

export const followsRepo = new FollowRepository();
