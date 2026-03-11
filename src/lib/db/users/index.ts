import { db } from "@/lib/db";
import { sql } from "kysely";
import { FollowRepository, followsRepo } from "../follow";

export class UsersRepository {
  async getRecommendedUsers(params: {
    viewerId: string;
    viewerValue: number;
    version: string;
    limit: number;
    offset: number;
    searchQuery?: string;
    sort?: string;
    order?: "distance" | "desc" | "newest";
  }) {
    const {
      viewerId,
      viewerValue,
      version,
      limit,
      offset,
      searchQuery,
      sort,
      order,
    } = params;
    const columnMap: Record<string, string> = {
      totalBpi: "usl.totalBpi",
      notes: "r.notes",
      chord: "r.chord",
      peak: "r.peak",
      charge: "r.charge",
      scratch: "r.scratch",
      soflan: "r.soflan",
    };
    const sortColumn =
      sort && columnMap[sort] ? columnMap[sort] : "usl.totalBpi";

    const latestStatusSubquery = db
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    let query = db
      .selectFrom("users as u")
      .innerJoin("userRadarCache as r", "u.userId", "r.userId")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "u.profileText",
        "usl.arenaRank",
        "usl.totalBpi",
        "usl.createdAt",
        "r.notes",
        "r.chord",
        "r.peak",
        "r.charge",
        "r.scratch",
        "r.soflan",
      ])
      .where("r.version", "=", version)
      .where("u.isPublic", "=", 1)
      .where("u.userId", "!=", viewerId);

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.where((eb) =>
        eb.or([
          eb("u.userName", "like", searchPattern),
          eb("u.iidxId", "like", searchPattern),
        ]),
      );
    }

    if (order === "newest") {
      query = query.orderBy("usl.createdAt", "desc");
    } else if (order === "desc") {
      query = query.orderBy(sql.ref(`${sortColumn}`), "desc");
    } else {
      query = query.orderBy(
        sql`ABS(${viewerValue} - ${sql.raw(sortColumn as string)})`,
        "asc",
      );
    }

    return await query.limit(limit).offset(offset).execute();
  }

  private async getRelationship(myId: string, targetId: string) {
    const follow = await db
      .selectFrom("follows")
      .select("id")
      .where("followerId", "=", myId)
      .where("followingId", "=", targetId)
      .executeTakeFirst();
    const followedBy = await db
      .selectFrom("follows")
      .select("id")
      .where("followerId", "=", targetId)
      .where("followingId", "=", myId)
      .executeTakeFirst();
    return {
      isFollowing: !!follow,
      isFollowedBy: !!followedBy,
      isMutual: !!follow && !!followedBy,
    };
  }

  async getUserProfileSummary(userId: string, myId?: string) {
    const userBase = await db
      .selectFrom("users as u")
      .select([
        "u.userId",
        "u.userName",
        "u.profileText",
        "u.profileImage",
        "u.iidxId",
        "u.xId",
        "u.isPublic",
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followingId", "=", userId)
            .as("followerCount"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followerId", "=", userId)
            .as("followingCount"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followerId", "=", myId ?? "GUEST")
            .where("followingId", "=", userId)
            .as("isFollowing"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followerId", "=", userId)
            .where("followingId", "=", myId ?? "GUEST")
            .as("isFollowedBy"),
      ])
      .where("u.userId", "=", userId)
      .executeTakeFirst();

    if (!userBase) return null;

    const history = await db
      .selectFrom("userStatusLogs as usl")
      .innerJoin(
        (eb) =>
          eb
            .selectFrom("userStatusLogs")
            .select(["version", (sub) => sub.fn.max("id").as("maxId")])
            .where("userId", "=", userId)
            .groupBy("version")
            .as("latest"),
        (join) => join.onRef("usl.id", "=", "latest.maxId"),
      )
      .select(["usl.version", "usl.totalBpi", "usl.arenaRank", "usl.updatedAt"])
      .orderBy("usl.version", "desc")
      .execute();

    const formattedHistory = history.map((h) => ({
      ...h,
      totalBpi: Number(h.totalBpi),
    }));

    return {
      ...userBase,
      follows: {
        follower: Number(userBase.followerCount ?? 0),
        following: Number(userBase.followingCount ?? 0),
      },
      relationship: {
        isFollowing: Number(userBase.isFollowing ?? 0) > 0,
        isFollowedBy: Number(userBase.isFollowedBy ?? 0) > 0,
        isMutual:
          Number(userBase.isFollowing ?? 0) > 0 &&
          Number(userBase.isFollowedBy ?? 0) > 0,
      },
      history: formattedHistory,
      current: formattedHistory[0] || null,
    };
  }
}
