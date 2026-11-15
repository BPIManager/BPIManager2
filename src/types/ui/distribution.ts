import type { ScoreListLink } from "@/utils/dashboard/scoreListLink";
export type RankDisplayMode = "rank" | "scoreRate";

export interface DistributionSectionProps {
  type: "rank" | "bpi" | "scoreRate";
  myUserId?: string;
  rivalUserId?: string;
  myName?: string;
  rivalName?: string;
  mode?: RankDisplayMode;
  onModeChange?: (mode: RankDisplayMode) => void;
  /** 自分のダッシュボードのみ true。ツールチップに「スコア一覧を表示」ボタンを出す */
  showListAction?: boolean;
  /** 一覧の遷移先。未指定は自分の一覧 */
  listLink?: ScoreListLink;
}
