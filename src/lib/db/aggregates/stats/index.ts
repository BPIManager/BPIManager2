import { statsTablesRepo } from "./tables";
import { statsChartsRepo } from "./charts";
import { statsSocialRepo } from "./social";

export { statsTablesRepo } from "./tables";
export { statsChartsRepo } from "./charts";
export { statsSocialRepo } from "./social";

/**
 * 統計ダッシュボード・分析画面向けのデータ取得を統合したファサードオブジェクト。
 *
 * 表形式データ（`tables.ts`）・チャート用データ（`charts.ts`）・
 * 近傍ユーザー比較（`social.ts`）に分割している（#182、旧`stats/index.ts`
 * 541行から分割）。新規コードでは個別のリポジトリを直接使用することを推奨する。
 */
export const statsRepo = {
  // 表形式データ
  getLatestTotalBpi: statsTablesRepo.getLatestTotalBpi.bind(statsTablesRepo),
  getAAATableData: statsTablesRepo.getAAATableData.bind(statsTablesRepo),
  getLatestScoresWithMusicData:
    statsTablesRepo.getLatestScoresWithMusicData.bind(statsTablesRepo),
  getScoreHistory: statsTablesRepo.getScoreHistory.bind(statsTablesRepo),
  getSongRanking: statsTablesRepo.getSongRanking.bind(statsTablesRepo),
  getTotalSongCount: statsTablesRepo.getTotalSongCount.bind(statsTablesRepo),
  getFilteredSongKeys:
    statsTablesRepo.getFilteredSongKeys.bind(statsTablesRepo),
  getUserSongRankings:
    statsTablesRepo.getUserSongRankings.bind(statsTablesRepo),

  // チャート用データ
  getActivityData: statsChartsRepo.getActivityData.bind(statsChartsRepo),
  getSongsWithUserBpiForBpmDistribution:
    statsChartsRepo.getSongsWithUserBpiForBpmDistribution.bind(
      statsChartsRepo,
    ),
  getBpiAndVolumePerDate:
    statsChartsRepo.getBpiAndVolumePerDate.bind(statsChartsRepo),

  // 近傍ユーザー比較
  getNeighborIds: statsSocialRepo.getNeighborIds.bind(statsSocialRepo),
  getNeighborScoreComparison:
    statsSocialRepo.getNeighborScoreComparison.bind(statsSocialRepo),
};
