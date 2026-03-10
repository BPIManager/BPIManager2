import { db } from "@/lib/db";
import { sql } from "kysely";

export class UsersRepository {
  async getRecommendedUsers(params: {
    viewerId: string;
    viewerTotalBpi: number;
    version: string;
    limit: number;
    range: number;
  }) {
    const { viewerId, viewerTotalBpi, version, limit, range } = params;

    const latestStatusSubquery = db
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    return await db
      .selectFrom("users as u")
      .innerJoin("userRadarCache as r", "u.userId", "r.userId")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.profileText",
        "usl.arenaRank",
        "r.totalBpi",
        "r.notes",
        "r.chord",
        "r.peak",
        "r.charge",
        "r.scratch",
        "r.soflan",
      ])
      .where("r.version", "=", version)
      .where("u.isPublic", "=", 1)
      .where("u.userId", "!=", viewerId)
      .where("r.totalBpi", ">", (viewerTotalBpi - range).toString())
      .where("r.totalBpi", "<", (viewerTotalBpi + range).toString())
      .orderBy(sql`ABS(${viewerTotalBpi} - r.totalBpi)`, "asc")
      .limit(limit)
      .execute();
  }

  async getUserProfileSummary(userId: string, myId?: string) {
    const user = await db
      .selectFrom("users")
      .where("userId", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!user) return null;

    const counts = await db
      .selectFrom("follows")
      .select([
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.count("id").as("cnt"))
            .where("followingId", "=", userId)
            .as("followerCount"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.count("id").as("cnt"))
            .where("followerId", "=", userId)
            .as("followingCount"),
      ])
      .executeTakeFirst();

    let relationship = {
      isFollowing: false,
      isFollowedBy: false,
      isMutual: false,
    };

    if (myId && myId !== userId) {
      const follow = await db
        .selectFrom("follows")
        .where("followerId", "=", myId)
        .where("followingId", "=", userId)
        .select("id")
        .executeTakeFirst();

      const followedBy = await db
        .selectFrom("follows")
        .where("followerId", "=", userId)
        .where("followingId", "=", myId)
        .select("id")
        .executeTakeFirst();

      relationship = {
        isFollowing: !!follow,
        isFollowedBy: !!followedBy,
        isMutual: !!follow && !!followedBy,
      };
    }

    const latestStatusIds = await db
      .selectFrom("userStatusLogs")
      .select(["version", (eb) => eb.fn.max("id").as("maxId")])
      .where("userId", "=", userId)
      .groupBy("version")
      .execute();

    const statusLogs =
      latestStatusIds.length > 0
        ? await db
            .selectFrom("userStatusLogs")
            .select(["version", "arenaRank", "totalBpi", "updatedAt"])
            .where(
              "id",
              "in",
              latestStatusIds.map((l) => l.maxId as number),
            )
            .execute()
        : [];

    const latestLogIds = await db
      .selectFrom("logs")
      .select(["version", (eb) => eb.fn.max("id").as("maxId")])
      .where("userId", "=", userId)
      .groupBy("version")
      .execute();

    const bpiLogs =
      latestLogIds.length > 0
        ? await db
            .selectFrom("logs")
            .select(["version", "totalBpi", "createdAt"])
            .where(
              "id",
              "in",
              latestLogIds.map((l) => l.maxId as number),
            )
            .execute()
        : [];

    const versionsMap = new Map();

    bpiLogs.forEach((log) => {
      versionsMap.set(log.version, {
        version: log.version,
        totalBpi: log.totalBpi,
        arenaRank: "N/A",
        updatedAt: log.createdAt,
      });
    });

    statusLogs.forEach((log) => {
      const existing = versionsMap.get(log.version);
      if (existing) {
        existing.arenaRank = log.arenaRank ?? "N/A";
      } else {
        versionsMap.set(log.version, {
          version: log.version,
          totalBpi: Number(log.totalBpi),
          arenaRank: log.arenaRank ?? "N/A",
          updatedAt: log.updatedAt,
        });
      }
    });

    const history = Array.from(versionsMap.values()).sort(
      (a, b) => Number(b.version) - Number(a.version),
    );

    return {
      ...user,
      follows: {
        follower: Number(counts?.followerCount ?? 0),
        following: Number(counts?.followingCount ?? 0),
      },
      relationship,
      history,
      current: history[0] || null,
    };
  }
}
