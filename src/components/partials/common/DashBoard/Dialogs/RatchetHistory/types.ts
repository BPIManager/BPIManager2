

import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";

// 潜在スキルa(実力指標)はBPIとスケールが異なるので専用の装飾色を使う(design-guidelines.md参照)
export const SKILL_COLOR = "#a78bfa";

export interface ChartPoint {
  date: string;
  raw: number;
  ratcheted: number;
  rawDelta: number;
  skill: number | null;
}

export const GROUP_BY_VALUES: StatsGroupBy[] = ["day", "week", "month"];

export interface HistoryStep {
  date: string;
  title: string;
  // 曲単位の場合のみ。日付単位では複数曲をまとめるため1曲分のスコアは表示しない
  newExScore?: number;
  newBpi?: number;
  rawAfter: number;
  // 比較対象の「直前」が存在しない(実質的な初回スコープ内プレイ/初日)場合はnull
  rawDelta: number | null;
  bestAfter: number;
  bestDelta: number | null;
  skillAfter: number | null;
  skillDelta: number | null;
}

export type ListGranularity = "song" | "date";

export type ContributionSortOrder = "date" | "impactDesc" | "impactAsc";

export const MAX_HISTORY_STEPS = 300;
