export { socialTimelineRepo } from "./timeline";
export { socialComparisonRepo } from "./comparison";

import { socialTimelineRepo } from "./timeline";
import { socialComparisonRepo } from "./comparison";

/**
 * ソーシャル機能の各サブリポジトリのメソッドを集約したファサードオブジェクト。
 *
 * 後方互換性維持のために `socialTimelineRepo` と `socialComparisonRepo` を統合している。
 * 新規コードでは個別のリポジトリを直接使用することを推奨する。
 */
export const socialRepo = {
  // タイムライン・フィード系
  getFollowedTimeline: socialTimelineRepo.getFollowedTimeline.bind(socialTimelineRepo),
  getViewerScoresForSongs: socialTimelineRepo.getViewerScoresForSongs.bind(socialTimelineRepo),

  // 比較・レーダー系
  getWinLossStats: socialComparisonRepo.getWinLossStats.bind(socialComparisonRepo),
  getUserRadar: socialComparisonRepo.getUserRadar.bind(socialComparisonRepo),
  getRivalScoresForSong: socialComparisonRepo.getRivalScoresForSong.bind(socialComparisonRepo),
  getFollowedWinLossSummary: socialComparisonRepo.getFollowedWinLossSummary.bind(socialComparisonRepo),
};
