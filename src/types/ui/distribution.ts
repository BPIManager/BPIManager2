export type RankDisplayMode = "rank" | "scoreRate";

export interface DistributionSectionProps {
  type: "rank" | "bpi" | "scoreRate";
  myUserId?: string;
  rivalUserId?: string;
  myName?: string;
  rivalName?: string;
  mode?: RankDisplayMode;
  onModeChange?: (mode: RankDisplayMode) => void;
}
