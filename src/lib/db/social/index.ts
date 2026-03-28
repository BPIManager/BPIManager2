export { socialTimelineRepo } from "./timeline";
export { socialComparisonRepo } from "./comparison";

import { socialTimelineRepo } from "./timeline";
import { socialComparisonRepo } from "./comparison";

/**
 * 後方互換性のため、全サブリポジトリのメソッドを集約したオブジェクト
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
