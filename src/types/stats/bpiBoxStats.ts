export type StatsGroupBy = "day" | "week" | "month";

export interface BpiBoxStatsItem {
  date: string;
  min: number;
  max: number;
  median: number;
  p25: number;
  p75: number;
  count: number;
  totalBpi: number;
  totalBpiTop75: number;
  totalBpiTop25: number;
}
