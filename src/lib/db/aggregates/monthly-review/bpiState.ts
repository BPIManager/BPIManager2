import { db } from "@/lib/db";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { jstDayStart, jstDayEnd } from "./dates";

import { scoreActivityRepo } from "@/lib/db/domains/scores/activity";
import { latestScoresRepo } from "@/lib/db/domains/scores/latest";

import { songSearchRepo } from "@/lib/db/domains/songs/search";

/**
 * 月次まとめの月初・比較バージョン時点のBPI状態・スコア履歴（複数ユーザー対応）を担当するリポジトリクラス。
 */
class MonthlyBpiStateRepository {
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
      .select(["s.userId", "s.songId", "s.bpi", "s.exScore"])
      .execute();
  }

  // scores・songsを横断JOINした複数ユーザー分のBPI状態一括取得のため、直接参照を維持する。
  // getPreMonthBpiStateForUsersの日時境界版と異なり、バージョンそのものを境界として使う
  // （全期間モードでの総合BPI比較・レーダー別成長の「期間前」baseline用）

  async getVersionBpiStateForUsers(userIds: string[], compareVersion: string) {
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
            .where("s2.version", "=", compareVersion)
            .where("m2.difficultyLevel", "=", 12)
            .where("m2.difficulty", "in", IIDX_DIFFICULTIES)
            .groupBy(["s2.userId", "s2.songId"])
            .as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.userId", "s.songId", "s.bpi", "s.exScore"])
      .execute();
  }

  // scores・songsを横断JOINした複数ユーザー分の月内スコア推移一括取得のため、直接参照を維持する。

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
      .select(["s.userId", "s.songId", "s.bpi", "s.exScore", "s.lastPlayed"])
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

  // scores・songs・songDefを横断JOINしたバッチ内スコア詳細取得のため、直接参照を維持する。

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
    return scoreActivityRepo.getLatestExScoresForSongsBeforeDate(
      userId,
      version,
      songIds,
      jstDayStart(monthStart),
    );
  }

  /** 「前作」等、比較対象バージョン内での最新スコアを取得する（全期間モードの楽曲ハイライト用） */
  async getComparisonVersionScores(
    userId: string,
    compareVersion: string,
    songIds: number[],
  ) {
    return latestScoresRepo.getLatestScoresForVersion(userId, compareVersion, songIds);
  }

  async getAllL12SongMeta() {
    return songSearchRepo.getMetaByLevelAndDifficulties(12, IIDX_DIFFICULTIES);
  }
}

export const monthlyBpiStateRepo = new MonthlyBpiStateRepository();
