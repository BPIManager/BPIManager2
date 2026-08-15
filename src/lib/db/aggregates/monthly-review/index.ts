import { db } from "@/lib/db";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import {
  latestLogIdPerSongSubquery,
  latestLogIdPerUserSongSubquery,
} from "@/lib/db/shared/latestScore";
import { scoresRepo } from "@/lib/db/domains/scores";
import { iidxTowerRepo } from "@/lib/db/domains/iidxTower";
import { songsRepo } from "@/lib/db/domains/songs";
import { getArenaStatsHistory } from "@/lib/db/domains/arenaHistory";
import { wherePublicOnly } from "@/lib/db/shared/visibility";

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
    return scoresRepo.getBatchesWithLastPlayedInRange(
      userId,
      version,
      jstDayStart(monthStart),
      jstDayEnd(monthEnd),
    );
  }

  async getMonthlyTowerStats(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return iidxTowerRepo.getRangeSummary(
      userId,
      version,
      toPlayDate(monthStart),
      toPlayDate(monthEnd),
    );
  }

  async getMonthlyArenaStats(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return getArenaStatsHistory(
      userId,
      version,
      new Date(`${monthStart}T00:00:00+09:00`),
      new Date(`${monthEnd}T23:59:59+09:00`),
    );
  }

  async getMonthlyTowerRanking(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return iidxTowerRepo.getRangeRanking(
      userId,
      version,
      toPlayDate(monthStart),
      toPlayDate(monthEnd),
    );
  }

  async getMonthlyDailyTowerData(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return iidxTowerRepo.getDailyInRange(
      userId,
      version,
      toPlayDate(monthStart),
      toPlayDate(monthEnd),
    );
  }

  // scores・songsを横断JOINした複数ユーザー分のBPI状態一括取得のため、直接参照を維持する。
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
    return scoresRepo.getLatestExScoresForSongsBeforeDate(
      userId,
      version,
      songIds,
      jstDayStart(monthStart),
    );
  }

  async getBatchSongRanks(
    userId: string,
    version: string,
    songIds: number[],
  ): Promise<Map<number, number>> {
    return scoresRepo.getSongRanksForSongs(userId, version, songIds);
  }

  async getMonthlyActivityBreakdownByLastPlayed(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return scoresRepo.getActivityBreakdownByLastPlayed(
      userId,
      version,
      jstDayStart(monthStart),
      jstDayEnd(monthEnd),
    );
  }

  // scores・songsを横断JOINしたレベル11/12現在スコア取得のため、直接参照を維持する。
  async getUserCurrentL1112Scores(userId: string, version: string) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("latest"),
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

  // scores・songsを横断JOINしたレベル11/12月初時点スコア取得のため、直接参照を維持する。
  async getUserPreMonthL1112Scores(
    userId: string,
    version: string,
    monthStart: string,
  ) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
          extra: (qb) =>
            qb.where("lastPlayed", "<", jstDayStart(monthStart)),
        }).as("latest"),
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

  // follows・users・scoresを横断JOINしたフォロー中ライバルの現在スコア取得のため、直接参照を維持する。
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
        latestLogIdPerUserSongSubquery({
          table: "scores",
          version,
          followersOf: viewerId,
          songIds,
        }).as("latest"),
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
      .$call((qb) => wherePublicOnly(qb, "u.isPublic"))
      .execute();
  }

  async getAllL12SongMeta() {
    return songsRepo.getMetaByLevelAndDifficulties(12, IIDX_DIFFICULTIES);
  }

  async getAvailableMonths(userId: string, version: string) {
    return scoresRepo.getAvailableMonths(userId, version);
  }
}

export const monthlyReviewRepo = new MonthlyReviewRepository();
