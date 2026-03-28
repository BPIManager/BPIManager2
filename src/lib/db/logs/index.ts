export { navigationRepo } from "./navigation";
export { scoreDetailRepo } from "./scores";
export { rivalRepo } from "./rival";
export { timelineRepo } from "./timeline";

import { navigationRepo } from "./navigation";
import { scoreDetailRepo } from "./scores";
import { rivalRepo } from "./rival";
import { timelineRepo } from "./timeline";

/**
 * 後方互換性のため、全サブリポジトリのメソッドを集約したオブジェクト
 */
export const logsRepo = {
  // ナビゲーション系（バッチ・日付）
  getJstRange: navigationRepo.getJstRange.bind(navigationRepo),
  getRangeNavigation: navigationRepo.getRangeNavigation.bind(navigationRepo),
  getBatchNavigation: navigationRepo.getBatchNavigation.bind(navigationRepo),
  findBatchById: navigationRepo.findBatchById.bind(navigationRepo),
  findBatchesInRange: navigationRepo.findBatchesInRange.bind(navigationRepo),

  // スコア詳細クエリ系
  getScoresWithDetails: scoreDetailRepo.getScoresWithDetails.bind(scoreDetailRepo),
  getScoresByLastPlayedRange: scoreDetailRepo.getScoresByLastPlayedRange.bind(scoreDetailRepo),
  getScoreHistory: scoreDetailRepo.getScoreHistory.bind(scoreDetailRepo),

  // ライバル比較系
  getRivalComparisonScores: rivalRepo.getRivalComparisonScores.bind(rivalRepo),
  getScoreComparisonList: rivalRepo.getScoreComparisonList.bind(rivalRepo),
  getOvertakenRivals: rivalRepo.getOvertakenRivals.bind(rivalRepo),
  getRivalAvgScores: rivalRepo.getRivalAvgScores.bind(rivalRepo),
  getRivalTopScores: rivalRepo.getRivalTopScores.bind(rivalRepo),

  // タイムライン・バージョン比較系
  getTimelineByBatches: timelineRepo.getTimelineByBatches.bind(timelineRepo),
  getBestEverScores: timelineRepo.getBestEverScores.bind(timelineRepo),
  getSelfVersionScores: timelineRepo.getSelfVersionScores.bind(timelineRepo),
};
