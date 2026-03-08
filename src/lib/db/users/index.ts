import { db } from "@/lib/db";

export class UsersRepository {
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
          totalBpi: log.totalBpi,
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
