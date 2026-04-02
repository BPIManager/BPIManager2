import type { RadarCategory } from "@/types/stats/radar";

export type OptimizerStrategy = "unplayed" | "played" | "radar-priority";

export interface SongOptimizerInput {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef: number | null;
  currentBpi: number;
  currentExScore: number | null;
  isUnplayed: boolean;
  radarCategory: RadarCategory | null;
}

export interface OptimizationStep {
  rank: number;
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  fromBpi: number;
  toBpi: number;
  fromExScore: number | null;
  toExScore: number;
  exScoreGap: number;
  bpiGain: number;
  cumulativeTotalBpi: number;
  isUnplayed: boolean;
  radarCategory: RadarCategory | null;
  isRadarStrength: boolean;
}

export interface OptimizationResult {
  steps: OptimizationStep[];
  currentTotalBpi: number;
  targetTotalBpi: number;
  originalTargetTotalBpi?: number;
  achievable: boolean;
  alreadyAchieved: boolean;
  totalSongCount: number;
  autoAdjustmentNote?: string;
  maxAchievableBpi?: number;
}

export interface OptimizerOptions {
  includeUnplayed: boolean;
  includePlayed: boolean;
  radarPriority: boolean;
  radarCategoryBpis: Partial<Record<RadarCategory, number>>;
  candidateLevels: number[];
  candidateDifficulties: string[];
  /** trueのとき現在の総合BPIをhumanCapの基準として使用する（デフォルトtrue） */
  considerCurrentTotalBpi?: boolean;
}
