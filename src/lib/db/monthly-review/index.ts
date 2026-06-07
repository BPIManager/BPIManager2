import { db } from "@/lib/db";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";
import { sql } from "kysely";

const jstDayStart = (jstDate: string): Date =>
  new Date(`${jstDate}T00:00:00+09:00`);
const jstDayEnd = (jstDate: string): Date =>
  new Date(`${jstDate}T23:59:59.999+09:00`);

const toPlayDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00Z`);

class MonthlyReviewRepository {
  async getMonthlyScoreBatches(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return (await db
      .selectFrom("scores")
      .select([
        "batchId",
        sql<string>`DATE_FORMAT(MAX(CONVERT_TZ(lastPlayed, '+00:00', '+09:00')), '%Y-%m-%d')`.as(
          "playDate",
        ),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("lastPlayed", ">=", jstDayStart(monthStart))
      .where("lastPlayed", "<=", jstDayEnd(monthEnd))
      .where("batchId", "is not", null)
      .groupBy("batchId")
      .execute()) as { batchId: string; playDate: string }[];
  }

  async getMonthlyTowerStats(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    const result = await db
      .selectFrom("iidxTower")
      .select([
        (eb) => eb.fn.sum<number>("keyCount").as("totalKeys"),
        (eb) => eb.fn.sum<number>("scratchCount").as("totalScratches"),
        (eb) => eb.fn.count<number>("playDate").as("playDays"),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("playDate", ">=", toPlayDate(monthStart))
      .where("playDate", "<=", toPlayDate(monthEnd))
      .executeTakeFirst();
    return {
      totalKeys: Number(result?.totalKeys ?? 0),
      totalScratches: Number(result?.totalScratches ?? 0),
      playDays: Number(result?.playDays ?? 0),
    };
  }

  async getMonthlyArenaStats(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("officialArenaStats")
      .select(["arenaClass", "arenaRank", "wins", "a1continue", "fetchedAt"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("fetchedAt", ">=", new Date(`${monthStart}T00:00:00+09:00`))
      .where("fetchedAt", "<=", new Date(`${monthEnd}T23:59:59+09:00`))
      .orderBy("fetchedAt", "asc")
      .execute();
  }

  async getMonthlyTowerRanking(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    const result = await db
      .selectFrom((eb) =>
        eb
          .selectFrom((qb) =>
            qb
              .selectFrom("iidxTower")
              .select([
                "userId",
                (eb2) => eb2.fn.sum<number>("keyCount").as("totalKeys"),
                (eb2) =>
                  eb2.fn.sum<number>("scratchCount").as("totalScratches"),
              ])
              .where("version", "=", version)
              .where("playDate", ">=", toPlayDate(monthStart))
              .where("playDate", "<=", toPlayDate(monthEnd))
              .groupBy("userId")
              .as("agg"),
          )
          .select((eb2) => [
            "agg.userId",
            "agg.totalKeys",
            "agg.totalScratches",
            eb2.fn
              .agg<number>("RANK")
              .over((ob) => ob.orderBy("agg.totalKeys", "desc"))
              .as("keysRank"),
            eb2.fn
              .agg<number>("RANK")
              .over((ob) => ob.orderBy("agg.totalScratches", "desc"))
              .as("scratchRank"),
            eb2.fn.countAll<number>().over().as("totalUsers"),
          ])
          .as("ranked"),
      )
      .select(["keysRank", "scratchRank", "totalUsers"])
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!result) return null;
    return {
      keysRank: Number(result.keysRank),
      scratchRank: Number(result.scratchRank),
      totalUsers: Number(result.totalUsers),
    };
  }

  async getMonthlyDailyTowerData(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("iidxTower")
      .select(["playDate", "keyCount", "scratchCount"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("playDate", ">=", toPlayDate(monthStart))
      .where("playDate", "<=", toPlayDate(monthEnd))
      .orderBy("playDate", "asc")
      .execute();
  }

  async getPreMonthBpiStateForUsers(
    userIds: string[],
    version: string,
    monthStart: string,
  ) {
    if (userIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .innerJoin("songs as m2", "s2.songId", "m2.songId")
            .select([
              "s2.userId",
              "s2.songId",
              (eb) => eb.fn.max("s2.logId").as("maxLogId"),
            ])
            .where("s2.userId", "in", userIds)
            .where("s2.version", "=", version)
            .where("m2.difficultyLevel", "=", 12)
            .where("m2.difficulty", "in", IIDX_DIFFICULTIES)
            .where("s2.lastPlayed", "<", jstDayStart(monthStart))
            .groupBy(["s2.userId", "s2.songId"])
            .as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.userId", "s.songId", "s.bpi"])
      .execute();
  }

  async getInMonthScoreHistoryForUsers(
    userIds: string[],
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    if (userIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .select(["s.userId", "s.songId", "s.bpi", "s.lastPlayed"])
      .where("s.userId", "in", userIds)
      .where("s.version", "=", version)
      .where("m.difficultyLevel", "=", 12)
      .where("m.difficulty", "in", IIDX_DIFFICULTIES)
      .where("s.lastPlayed", ">=", jstDayStart(monthStart))
      .where("s.lastPlayed", "<=", jstDayEnd(monthEnd))
      .orderBy("s.lastPlayed", "asc")
      .orderBy("s.logId", "asc")
      .execute();
  }

  async getScoresForBatches(
    userId: string,
    version: string,
    batchIds: string[],
  ) {
    if (batchIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .select([
        "s.logId",
        "s.songId",
        "s.bpi",
        "s.exScore",
        "s.batchId",
        "m.title",
        "m.difficulty",
        "m.difficultyLevel",
        "m.notes",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.batchId", "in", batchIds)
      .execute();
  }

  async getPreMonthScoresByLastPlayed(
    userId: string,
    version: string,
    songIds: number[],
    monthStart: string,
  ) {
    if (songIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select(["s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .where("s2.songId", "in", songIds)
            .where("s2.lastPlayed", "<", jstDayStart(monthStart))
            .groupBy("s2.songId")
            .as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.bpi", "s.exScore"])
      .execute();
  }

  async getBatchSongRanks(
    userId: string,
    version: string,
    songIds: number[],
  ): Promise<Map<number, number>> {
    if (songIds.length === 0) return new Map();
    const rows = await db
      .selectFrom((eb) =>
        eb
          .selectFrom((qb) =>
            qb
              .selectFrom("scores as s")
              .innerJoin(
                (qb2) =>
                  qb2
                    .selectFrom("scores")
                    .select([
                      "userId",
                      "songId",
                      (eb2) => eb2.fn.max("logId").as("maxLogId"),
                    ])
                    .where("songId", "in", songIds)
                    .where("version", "=", version)
                    .groupBy(["userId", "songId"])
                    .as("latest"),
                (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
              )
              .select([
                "s.songId",
                "s.userId",
                (eb2) =>
                  eb2.fn
                    .agg<number>("RANK")
                    .over((ob) =>
                      ob.partitionBy("s.songId").orderBy("s.exScore", "desc"),
                    )
                    .as("rnk"),
              ])
              .where("s.songId", "in", songIds)
              .as("ranked"),
          )
          .selectAll()
          .where("userId", "=", userId)
          .as("mine"),
      )
      .select(["songId", "rnk"])
      .execute();
    const map = new Map<number, number>();
    for (const r of rows) map.set(r.songId, Number(r.rnk));
    return map;
  }

  async getMonthlyActivityBreakdownByLastPlayed(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("scores as s")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as(
          "dow",
        ),
        sql<number>`HOUR(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as(
          "hour",
        ),
        sql<number>`COUNT(DISTINCT s.songId)`.as("count"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.lastPlayed", ">=", jstDayStart(monthStart))
      .where("s.lastPlayed", "<=", jstDayEnd(monthEnd))
      .groupBy(["dow", "hour"])
      .execute();
  }

  async getUserCurrentL1112Scores(userId: string, version: string) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select(["s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .groupBy("s2.songId")
            .as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "s.songId",
        "s.exScore",
        "m.title",
        "m.difficulty",
        "m.difficultyLevel",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("m.difficultyLevel", "in", [11, 12])
      .execute();
  }

  async getUserPreMonthL1112Scores(
    userId: string,
    version: string,
    monthStart: string,
  ) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select(["s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .where("s2.lastPlayed", "<", jstDayStart(monthStart))
            .groupBy("s2.songId")
            .as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.exScore"])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("m.difficultyLevel", "in", [11, 12])
      .execute();
  }

  async getRivalsCurrentScoresForSongs(
    viewerId: string,
    version: string,
    songIds: number[],
  ) {
    if (songIds.length === 0) return [];
    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .innerJoin("scores as s", "u.userId", "s.userId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .innerJoin("follows as f2", "f2.followingId", "s2.userId")
            .select([
              "s2.userId",
              "s2.songId",
              (eb) => eb.fn.max("s2.logId").as("maxLogId"),
            ])
            .where("f2.followerId", "=", viewerId)
            .where("s2.version", "=", version)
            .where("s2.songId", "in", songIds)
            .groupBy(["s2.userId", "s2.songId"])
            .as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "s.songId",
        "s.exScore",
      ])
      .where("f.followerId", "=", viewerId)
      .where("s.version", "=", version)
      .where("u.isPublic", "=", 1)
      .execute();
  }

  async getAllL12SongMeta() {
    return await db
      .selectFrom("songs as m")
      .select(["m.songId", "m.title", "m.difficulty"])
      .where("m.difficultyLevel", "=", 12)
      .where("m.difficulty", "in", IIDX_DIFFICULTIES)
      .execute();
  }

  async getAvailableMonths(userId: string, version: string) {
    const rows = await db
      .selectFrom("scores")
      .select(
        sql<string>`DATE_FORMAT(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'), '%Y-%m')`.as(
          "month",
        ),
      )
      .where("userId", "=", userId)
      .where("version", "=", version)
      .groupBy(
        sql`DATE_FORMAT(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'), '%Y-%m')`,
      )
      .orderBy(sql`month`, "desc")
      .execute();
    return rows.map((r) => r.month);
  }
}

export const monthlyReviewRepo = new MonthlyReviewRepository();
