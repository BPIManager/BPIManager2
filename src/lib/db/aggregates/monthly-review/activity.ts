

import { scoreActivityRepo } from "@/lib/db/domains/scores/activity";
import { jstDayStart, jstDayEnd } from "./dates";

import { iidxTowerRepo } from "@/lib/db/domains/iidxTower";

import { getArenaStatsHistory, getLatestArenaStatsPerVersion } from "@/lib/db/domains/arenaHistory";

const toPlayDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00Z`);

/**
 * 月次まとめの活動量・タワー・アリーナ・月の一覧（集計）を担当するリポジトリクラス。
 */
class MonthlyActivityRepository {
  async getMonthlyScoreBatches(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return scoreActivityRepo.getBatchesWithLastPlayedInRange(
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

  /** バージョンごとの最終（そのバージョンで最後に取得された）アリーナ戦績を取得する（全期間振り返りのアリーナ履歴用） */
  async getArenaVersionHistory(userId: string) {
    return getLatestArenaStatsPerVersion(userId);
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

  async getMonthlyActivityBreakdownByLastPlayed(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return scoreActivityRepo.getActivityBreakdownByLastPlayed(
      userId,
      version,
      jstDayStart(monthStart),
      jstDayEnd(monthEnd),
    );
  }

  // scores・songsを横断JOINしたレベル11/12現在スコア取得のため、直接参照を維持する。

  async getAvailableMonths(userId: string, version: string) {
    return scoreActivityRepo.getAvailableMonths(userId, version);
  }
}

export const monthlyActivityRepo = new MonthlyActivityRepository();
