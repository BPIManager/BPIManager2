import { scoresRepo as scoresCoreFacade } from "@/lib/db/domains/scores";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { scoreTimelineRepo } from "@/lib/db/aggregates/scoreTimeline";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { socialTimelineRepo } from "@/lib/db/aggregates/rivalScores/feed";

export { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
export { scoreTimelineRepo } from "@/lib/db/aggregates/scoreTimeline";
export { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
export { socialTimelineRepo } from "@/lib/db/aggregates/rivalScores/feed";

/**
 * `domains/scores`の基本CRUD・詳細クエリ・自己タイムラインに加え、
 * `aggregates/rivalScores`・`aggregates/scoreTimeline`のクロスドメイン
 * 複合ビューまで統合したファサードオブジェクト。
 *
 * `domains/scores`側にこのファサードを置くと`domains → aggregates`の
 * 逆方向依存になるため、`aggregates/`側に置く（#166）。
 * 新規コードでは個別のリポジトリを直接使用することを推奨する。
 */
export const scoresRepo = {
  ...scoresCoreFacade,

  // ライバル比較系
  getRivalComparisonScores:
    rivalRepo.getRivalComparisonScores.bind(rivalRepo),
  getScoreComparisonList: rivalRepo.getScoreComparisonList.bind(rivalRepo),
  getOvertakenRivals: rivalRepo.getOvertakenRivals.bind(rivalRepo),
  getRivalAvgScores: rivalRepo.getRivalAvgScores.bind(rivalRepo),
  getRivalTopScores: rivalRepo.getRivalTopScores.bind(rivalRepo),
  getRivalLatestScoresBySong:
    rivalRepo.getRivalLatestScoresBySong.bind(rivalRepo),
  getFollowedScoresForSong: rivalRepo.getFollowedScoresForSong.bind(rivalRepo),

  // タイムライン・バージョン比較系
  getTimelineByBatches:
    scoreTimelineRepo.getTimelineByBatches.bind(scoreTimelineRepo),

  // ソーシャル比較系（勝敗統計・レーダー・楽曲別スコア）
  getWinLossStats:
    socialComparisonRepo.getWinLossStats.bind(socialComparisonRepo),
  getWinLossHistory:
    socialComparisonRepo.getWinLossHistory.bind(socialComparisonRepo),
  getUserRadar: socialComparisonRepo.getUserRadar.bind(socialComparisonRepo),
  getFollowedWinLossSummary:
    socialComparisonRepo.getFollowedWinLossSummary.bind(socialComparisonRepo),

  // ソーシャルフィード系（フォロー中ユーザーのスコア更新タイムライン）
  getFollowedTimeline:
    socialTimelineRepo.getFollowedTimeline.bind(socialTimelineRepo),
  getViewerScoresForSongs:
    socialTimelineRepo.getViewerScoresForSongs.bind(socialTimelineRepo),
};
