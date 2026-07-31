import { db } from "@/lib/db";
import { sql } from "kysely";

const JST_TODAY_START = sql<Date>`CONVERT_TZ(CONCAT(DATE(CONVERT_TZ(NOW(), '+00:00', '+09:00')), ' 00:00:00'), '+09:00', '+00:00')`;

const PERIODS = { all: null, d90: 90, d30: 30, d7: 7 } as const;
type Period = keyof typeof PERIODS;

/**
 * サイト統計ダッシュボードの時間帯別・曜日別サイト活動集計を担当する
 * リポジトリクラス（#183で`siteStats/index.ts`から分割）。
 *
 * `getHourly*`/`getWeekday*`の4つのprivateヘルパーはJST変換ロジックを
 * 共有する密結合したペアのため、同一ファイルにまとめている。
 */
class SiteStatsActivityDistributionRepository {
  // getHourlyAllScoresとペアで時間帯別サイト活動を集計するため、直接参照を維持する（JST時間帯式を共有）。
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

  // scores・allScores×allSongsを横断する時間帯別集計のため、直接参照を維持する。
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

  // getWeekdayAllScoresとペアで曜日別サイト活動を集計するため、直接参照を維持する（JST曜日式を共有）。
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

  // scores・allScores×allSongsを横断する曜日別集計のため、直接参照を維持する。
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
}

export const siteStatsActivityDistributionRepo =
  new SiteStatsActivityDistributionRepository();
