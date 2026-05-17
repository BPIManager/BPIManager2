import { db } from "@/lib/db";
import { sql } from "kysely";
import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";
import { latestVersion } from "@/constants/latestVersion";

export { ARENA_RANK_ORDER };

const DATE_EXPR = sql<string>`DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '+09:00'), '%Y-%m-%d')`;

const JST_TODAY_START = sql<Date>`CONVERT_TZ(CONCAT(DATE(CONVERT_TZ(NOW(), '+00:00', '+09:00')), ' 00:00:00'), '+09:00', '+00:00')`;

const PERIODS = { all: null, d90: 90, d30: 30, d7: 7 } as const;
type Period = keyof typeof PERIODS;

class SiteStatsRepository {
  async getSummary() {
    const yesterday = sql`DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+09:00')), INTERVAL 1 DAY)`;

    const BK_VERSIONS = ["26", "27", "28", "29", "30", "31", "32"] as const;
    const EXCLUDE_FROM_CURRENT = [...BK_VERSIONS, "INF"] as const;

    const [
      totalUsers,
      newUsersToday,
      totalLogs,
      newLogsToday,

      totalBk,
      newBkYesterday,
      totalScores,
      newScoresToday,
      totalAllLow,
      newAllLowToday,
    ] = await Promise.all([
      db
        .selectFrom("users")
        .select((eb) => eb.fn.count("userId").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("users")
        .select((eb) => eb.fn.count("userId").as("count"))
        .where(
          sql`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
          "=",
          yesterday,
        )
        .executeTakeFirst(),

      db
        .selectFrom("logs")
        .select((eb) => eb.fn.count("id").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select((eb) => eb.fn.count("id").as("count"))
        .where(
          sql`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
          "=",
          yesterday,
        )
        .executeTakeFirst(),

      db
        .selectFrom("bkScores")
        .select((eb) => eb.fn.count("logId").as("count"))
        .where("version", "in", BK_VERSIONS)
        .executeTakeFirst(),
      db
        .selectFrom("bkScores")
        .select((eb) => eb.fn.count("logId").as("count"))
        .where("version", "in", BK_VERSIONS)
        .where(
          sql`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
          "=",
          yesterday,
        )
        .executeTakeFirst(),

      db
        .selectFrom("scores")
        .select((eb) => eb.fn.count("logId").as("count"))
        .where("version", "not in", EXCLUDE_FROM_CURRENT)
        .executeTakeFirst(),
      db
        .selectFrom("scores")
        .select((eb) => eb.fn.count("logId").as("count"))
        .where("version", "not in", EXCLUDE_FROM_CURRENT)
        .where(
          sql`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
          "=",
          yesterday,
        )
        .executeTakeFirst(),

      db
        .selectFrom("allScores as s")
        .innerJoin("allSongs as sg", "sg.songId", "s.songId")
        .select((eb) => eb.fn.count("s.logId").as("count"))
        .where("sg.difficultyLevel", "not in", [11, 12])
        .where("s.version", "not in", EXCLUDE_FROM_CURRENT)
        .executeTakeFirst(),
      db
        .selectFrom("allScores as s")
        .innerJoin("allSongs as sg", "sg.songId", "s.songId")
        .select((eb) => eb.fn.count("s.logId").as("count"))
        .where("sg.difficultyLevel", "not in", [11, 12])
        .where("s.version", "not in", EXCLUDE_FROM_CURRENT)
        .where(
          sql`DATE(CONVERT_TZ(s.createdAt, '+00:00', '+09:00'))`,
          "=",
          yesterday,
        )
        .executeTakeFirst(),
    ]);

    return {
      totalUsers: Number(totalUsers?.count ?? 0),
      newUsersToday: Number(newUsersToday?.count ?? 0),
      totalLogs: Number(totalLogs?.count ?? 0),
      newLogsToday: Number(newLogsToday?.count ?? 0),
      totalAllScores:
        Number(totalBk?.count ?? 0) +
        Number(totalScores?.count ?? 0) +
        Number(totalAllLow?.count ?? 0),
      newAllScoresToday:
        Number(newBkYesterday?.count ?? 0) +
        Number(newScoresToday?.count ?? 0) +
        Number(newAllLowToday?.count ?? 0),
    };
  }

  async getDailyRegistrations(days: number = 90) {
    const interval = sql<Date>`DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
    const scoreDateExpr = sql<string>`DATE_FORMAT(CONVERT_TZ(s.createdAt, '+00:00', '+09:00'), '%Y-%m-%d')`;

    const [usersData, logsData, scoresHighData, scoresLowData, scores1112Data] =
      await Promise.all([
        db
          .selectFrom("users")
          .select([DATE_EXPR.as("date"), sql<number>`COUNT(*)`.as("count")])
          .where("createdAt", "is not", null)
          .where("createdAt", ">=", interval)
          .where("createdAt", "<", JST_TODAY_START)
          .groupBy(DATE_EXPR)
          .orderBy("date", "asc")
          .execute(),

        db
          .selectFrom("logs")
          .select([DATE_EXPR.as("date"), sql<number>`COUNT(*)`.as("count")])
          .where("createdAt", ">=", interval)
          .where("createdAt", "<", JST_TODAY_START)
          .groupBy(DATE_EXPR)
          .orderBy("date", "asc")
          .execute(),

        db
          .selectFrom("scores as s")
          .select([scoreDateExpr.as("date"), sql<number>`COUNT(*)`.as("count")])
          .where("s.createdAt", ">=", interval)
          .where("s.createdAt", "<", JST_TODAY_START)
          .groupBy(scoreDateExpr)
          .orderBy("date", "asc")
          .execute(),

        db
          .selectFrom("allScores as s")
          .innerJoin("allSongs as sg", "sg.songId", "s.songId")
          .select([scoreDateExpr.as("date"), sql<number>`COUNT(*)`.as("count")])
          .where("sg.difficultyLevel", "not in", [11, 12])
          .where("s.createdAt", ">=", interval)
          .where("s.createdAt", "<", JST_TODAY_START)
          .groupBy(scoreDateExpr)
          .orderBy("date", "asc")
          .execute(),

        db
          .selectFrom("scores as s")
          .innerJoin("songs as sg", "s.songId", "sg.songId")
          .select([scoreDateExpr.as("date"), sql<number>`COUNT(*)`.as("count")])
          .where("sg.difficultyLevel", "in", [11, 12])
          .where("s.createdAt", ">=", interval)
          .where("s.createdAt", "<", JST_TODAY_START)
          .groupBy(scoreDateExpr)
          .orderBy("date", "asc")
          .execute(),
      ]);

    const map = new Map<
      string,
      {
        date: string;
        users: number;
        logs: number;
        allScores: number;
        scores: number;
      }
    >();
    const ensure = (d: string) => {
      if (!map.has(d))
        map.set(d, { date: d, users: 0, logs: 0, allScores: 0, scores: 0 });
      return map.get(d)!;
    };

    usersData.forEach(
      (r) => r.date && (ensure(String(r.date)).users = Number(r.count)),
    );
    logsData.forEach(
      (r) => r.date && (ensure(String(r.date)).logs = Number(r.count)),
    );

    scoresHighData.forEach(
      (r) => r.date && (ensure(String(r.date)).allScores += Number(r.count)),
    );
    scoresLowData.forEach(
      (r) => r.date && (ensure(String(r.date)).allScores += Number(r.count)),
    );

    scores1112Data.forEach(
      (r) => r.date && (ensure(String(r.date)).scores = Number(r.count)),
    );

    return Array.from(map.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }

  async getArenaRankDistribution() {
    const rows = await db
      .with("latest_per_user", (cte) =>
        cte
          .selectFrom("officialArenaStats")
          .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
          .where("version", "=", latestVersion)
          .groupBy("userId"),
      )
      .selectFrom("officialArenaStats as oas")
      .innerJoin("latest_per_user as lpu", "lpu.maxId", "oas.id")
      .select(["oas.arenaClass", sql<number>`COUNT(*)`.as("count")])
      .groupBy("oas.arenaClass")
      .execute();

    const countOf = (rank: string) =>
      rows
        .filter((r) => r.arenaClass === rank)
        .reduce((s, r) => s + Number(r.count), 0);

    return (ARENA_RANK_ORDER as readonly string[]).map((r) => ({
      rank: r,
      count: countOf(r),
    }));
  }

  async getAreaDistribution() {
    const rows = await db
      .with("latest_per_user", (cte) =>
        cte
          .selectFrom("officialArenaStats")
          .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
          .where("version", "=", latestVersion)
          .groupBy("userId"),
      )
      .selectFrom("officialArenaStats as oas")
      .innerJoin("latest_per_user as lpu", "lpu.maxId", "oas.id")
      .where("oas.area", "is not", null)
      .select(["oas.area", sql<number>`COUNT(*)`.as("count")])
      .groupBy("oas.area")
      .orderBy(sql`COUNT(*)`, "desc")
      .execute();

    return rows
      .filter((r) => r.area != null)
      .map((r) => ({ area: r.area as string, count: Number(r.count) }));
  }

  async getVersionScoreDistribution() {
    const BK_VERSIONS = ["26", "27", "28", "29", "30", "31", "32"] as const;
    const EXCLUDE_FROM_CURRENT = [...BK_VERSIONS, "INF"];

    const [bkRows, scoresRows, allScoresRows] = await Promise.all([
      db
        .selectFrom("bkScores")
        .select(["version", sql<number>`COUNT(*)`.as("count")])
        .where("version", "in", BK_VERSIONS)
        .groupBy("version")
        .execute(),

      db
        .selectFrom("scores")
        .select(["version", sql<number>`COUNT(*)`.as("count")])
        .where("version", "not in", EXCLUDE_FROM_CURRENT)
        .groupBy("version")
        .execute(),

      db
        .selectFrom("allScores as s")
        .innerJoin("allSongs as sg", "sg.songId", "s.songId")
        .select(["s.version", sql<number>`COUNT(*)`.as("count")])
        .where("sg.difficultyLevel", "not in", [11, 12])
        .where("s.version", "not in", EXCLUDE_FROM_CURRENT)
        .groupBy("s.version")
        .execute(),
    ]);

    const map = new Map<string, number>();
    const add = (v: string | null | undefined, n: number) => {
      if (!v) return;
      map.set(v, (map.get(v) ?? 0) + n);
    };
    bkRows.forEach((r) => add(r.version, Number(r.count)));
    scoresRows.forEach((r) => add(r.version, Number(r.count)));
    allScoresRows.forEach((r) => add(r.version, Number(r.count)));

    const bkSet = new Set<string>(BK_VERSIONS);
    const others = [...map.keys()]
      .filter((v) => !bkSet.has(v) && v !== "INF")
      .sort((a, b) => Number(a) - Number(b));
    const ordered = [...BK_VERSIONS, ...others];

    const versions = ordered.map((v) => ({
      version: v,
      count: map.get(v) ?? 0,
    }));
    const total = versions.reduce((s, r) => s + r.count, 0);
    return { versions, total };
  }

  private async getHourlyLogs(days?: number | null) {
    let q = db
      .selectFrom("logs")
      .select([
        sql<number>`HOUR(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`.as("hour"),
        sql<number>`COUNT(*)`.as("count"),
      ]);
    if (days)
      q = q.where(
        "createdAt",
        ">=",
        sql<Date>`DATE_SUB(NOW(), INTERVAL ${days} DAY)`,
      );
    q = q.where("createdAt", "<", JST_TODAY_START);
    const rows = await q
      .groupBy(sql`HOUR(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`)
      .execute();
    const m = new Map(rows.map((r) => [Number(r.hour), Number(r.count)]));
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: m.get(i) ?? 0,
    }));
  }

  private async getHourlyAllScores(days?: number | null) {
    const interval = days
      ? sql<Date>`DATE_SUB(NOW(), INTERVAL ${days} DAY)`
      : null;

    let qScores = db
      .selectFrom("scores")
      .select([
        sql<number>`HOUR(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`.as("hour"),
        sql<number>`COUNT(*)`.as("count"),
      ]);
    if (interval) qScores = qScores.where("createdAt", ">=", interval);
    qScores = qScores.where("createdAt", "<", JST_TODAY_START);

    let qLow = db
      .selectFrom("allScores as s")
      .innerJoin("allSongs as sg", "sg.songId", "s.songId")
      .select([
        sql<number>`HOUR(CONVERT_TZ(s.createdAt, '+00:00', '+09:00'))`.as(
          "hour",
        ),
        sql<number>`COUNT(*)`.as("count"),
      ])
      .where("sg.difficultyLevel", "not in", [11, 12]);
    if (interval) qLow = qLow.where("s.createdAt", ">=", interval);
    qLow = qLow.where("s.createdAt", "<", JST_TODAY_START);

    const [r1, r2] = await Promise.all([
      qScores
        .groupBy(sql`HOUR(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`)
        .execute(),
      qLow
        .groupBy(sql`HOUR(CONVERT_TZ(s.createdAt, '+00:00', '+09:00'))`)
        .execute(),
    ]);

    const m = new Map<number, number>();
    r1.forEach((r) =>
      m.set(Number(r.hour), (m.get(Number(r.hour)) ?? 0) + Number(r.count)),
    );
    r2.forEach((r) =>
      m.set(Number(r.hour), (m.get(Number(r.hour)) ?? 0) + Number(r.count)),
    );
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: m.get(i) ?? 0,
    }));
  }

  private async getWeekdayLogs(days?: number | null) {
    let q = db
      .selectFrom("logs")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`.as(
          "weekday",
        ),
        sql<number>`COUNT(*)`.as("count"),
      ]);
    if (days)
      q = q.where(
        "createdAt",
        ">=",
        sql<Date>`DATE_SUB(NOW(), INTERVAL ${days} DAY)`,
      );
    q = q.where("createdAt", "<", JST_TODAY_START);
    const rows = await q
      .groupBy(sql`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`)
      .execute();
    const m = new Map(rows.map((r) => [Number(r.weekday), Number(r.count)]));
    return Array.from({ length: 7 }, (_, i) => ({
      weekday: i + 1,
      count: m.get(i + 1) ?? 0,
    }));
  }

  private async getWeekdayAllScores(days?: number | null) {
    const interval = days
      ? sql<Date>`DATE_SUB(NOW(), INTERVAL ${days} DAY)`
      : null;

    let qScores = db
      .selectFrom("scores")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`.as(
          "weekday",
        ),
        sql<number>`COUNT(*)`.as("count"),
      ]);
    if (interval) qScores = qScores.where("createdAt", ">=", interval);
    qScores = qScores.where("createdAt", "<", JST_TODAY_START);

    let qLow = db
      .selectFrom("allScores as s")
      .innerJoin("allSongs as sg", "sg.songId", "s.songId")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(s.createdAt, '+00:00', '+09:00'))`.as(
          "weekday",
        ),
        sql<number>`COUNT(*)`.as("count"),
      ])
      .where("sg.difficultyLevel", "not in", [11, 12]);
    if (interval) qLow = qLow.where("s.createdAt", ">=", interval);
    qLow = qLow.where("s.createdAt", "<", JST_TODAY_START);

    const [r1, r2] = await Promise.all([
      qScores
        .groupBy(sql`DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`)
        .execute(),
      qLow
        .groupBy(sql`DAYOFWEEK(CONVERT_TZ(s.createdAt, '+00:00', '+09:00'))`)
        .execute(),
    ]);

    const m = new Map<number, number>();
    r1.forEach((r) =>
      m.set(
        Number(r.weekday),
        (m.get(Number(r.weekday)) ?? 0) + Number(r.count),
      ),
    );
    r2.forEach((r) =>
      m.set(
        Number(r.weekday),
        (m.get(Number(r.weekday)) ?? 0) + Number(r.count),
      ),
    );
    return Array.from({ length: 7 }, (_, i) => ({
      weekday: i + 1,
      count: m.get(i + 1) ?? 0,
    }));
  }

  async getHourlyDistribution() {
    const results = await Promise.all(
      (Object.entries(PERIODS) as [Period, number | null][]).flatMap(
        ([, days]) => [this.getHourlyLogs(days), this.getHourlyAllScores(days)],
      ),
    );
    const periods = Object.keys(PERIODS) as Period[];
    return Object.fromEntries(
      periods.map((p, i) => [
        p,
        results[i * 2].map((l, j) => ({
          hour: l.hour,
          logs: l.count,
          allScores: results[i * 2 + 1][j].count,
        })),
      ]),
    ) as Record<Period, { hour: number; logs: number; allScores: number }[]>;
  }

  async getWeekdayDistribution() {
    const results = await Promise.all(
      (Object.entries(PERIODS) as [Period, number | null][]).flatMap(
        ([, days]) => [
          this.getWeekdayLogs(days),
          this.getWeekdayAllScores(days),
        ],
      ),
    );
    const periods = Object.keys(PERIODS) as Period[];
    return Object.fromEntries(
      periods.map((p, i) => [
        p,
        results[i * 2].map((l, j) => ({
          weekday: l.weekday,
          logs: l.count,
          allScores: results[i * 2 + 1][j].count,
        })),
      ]),
    ) as Record<Period, { weekday: number; logs: number; allScores: number }[]>;
  }

  async getSongPopulationPage(
    order: "top" | "bottom",
    offset: number,
    limit: number,
  ) {
    const dir = order === "top" ? "desc" : "asc";
    const rows = await db
      .selectFrom("scores as s")
      .innerJoin("songs as sg", "s.songId", "sg.songId")
      .select([
        "s.songId",
        "sg.title",
        "sg.difficulty",
        sql<number>`COUNT(DISTINCT s.userId)`.as("playerCount"),
      ])
      .where("sg.difficultyLevel", "=", 12)
      .groupBy(["s.songId", "sg.title", "sg.difficulty"])
      .orderBy(sql`COUNT(DISTINCT s.userId)`, dir)
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((r) => ({
      songId: r.songId,
      title: r.title,
      difficulty: r.difficulty,
      playerCount: Number(r.playerCount),
    }));
  }

  async getSongPopulationTotal() {
    const result = await db
      .selectFrom("scores as s")
      .innerJoin("songs as sg", "s.songId", "sg.songId")
      .select(sql<number>`COUNT(DISTINCT s.songId)`.as("count"))
      .where("sg.difficultyLevel", "=", 12)
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }
}

export const siteStatsRepo = new SiteStatsRepository();
