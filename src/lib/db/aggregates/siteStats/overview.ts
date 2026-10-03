import { db } from "@/lib/db";
import { sql } from "kysely";

import { usersRepo } from "@/lib/db/domains/users";
import { logTotalBpiRepo } from "@/lib/db/domains/logs/totalBpi";
import { scoreActivityRepo } from "@/lib/db/domains/scores/activity";

const DATE_EXPR = sql<string>`DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '+09:00'), '%Y-%m-%d')`;

const JST_TODAY_START = sql<Date>`CONVERT_TZ(CONCAT(DATE(CONVERT_TZ(NOW(), '+00:00', '+09:00')), ' 00:00:00'), '+09:00', '+00:00')`;


/**
 * サイト全体の概要（件数・日別登録数）を担当するリポジトリクラス。
 */
class SiteStatsOverviewRepository {
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
      usersRepo.getCount(),
      usersRepo.getCount(yesterday),

      logTotalBpiRepo.getCount(),
      logTotalBpiRepo.getCount(yesterday),

      // bkScoresは所有ドメインが存在しない旧バージョンスコアの集計専用テーブルのため、直接参照を維持する。
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

      scoreActivityRepo.getCountExcludingVersions(EXCLUDE_FROM_CURRENT),
      scoreActivityRepo.getCountExcludingVersions(EXCLUDE_FROM_CURRENT, yesterday),

      // allScores×allSongsの横断JOIN（難易度絞り込み）のため、直接参照を維持する。
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
      totalUsers,
      newUsersToday,
      totalLogs,
      newLogsToday,
      totalAllScores:
        Number(totalBk?.count ?? 0) +
        totalScores +
        Number(totalAllLow?.count ?? 0),
      newAllScoresToday:
        Number(newBkYesterday?.count ?? 0) +
        newScoresToday +
        Number(newAllLowToday?.count ?? 0),
    };
  }

  // users・logs・scores・allScores×allSongsを横断する日次集計を1つの日付軸にマージするため、直接参照を維持する。

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
}

export const siteStatsOverviewRepo = new SiteStatsOverviewRepository();
