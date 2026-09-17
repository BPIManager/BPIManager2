import type { RadarCategory } from "@/types/stats/radar";
import type { IBpiBasicSongData } from "@/types/songs/bpi";

export type OptimizerStrategy = "unplayed" | "played";

export interface SongOptimizerInput
  extends Pick<
    IBpiBasicSongData,
    "notes" | "kaidenAvg" | "wrScore" | "coef" | "mu" | "sigma" | "residualVar"
  > {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
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
  notes: number;
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

/** `ColdStartGuard`が候補から除外したカテゴリの案内（曲を数曲プレイしてもらうための情報）。 */
export interface ColdCategoryAdvisory {
  category: RadarCategory;
  /** 現時点でこのカテゴリに属する曲のプレイ済み件数。 */
  playedCount: number;
  /** まずプレイしてほしい、このカテゴリの未プレイ曲（数曲）。 */
  suggestions: { songId: number; title: string; difficulty: string }[];
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
  /** データが薄く推定を見送ったレーダーカテゴリ（`ColdStartGuard`）。無ければ省略。 */
  coldCategories?: ColdCategoryAdvisory[];
}

export interface OptimizerOptions {
  includeUnplayed: boolean;
  includePlayed: boolean;
  radarElementFilter: RadarCategory[] | null;
  candidateLevels: number[];
  candidateDifficulties: string[];
  considerCurrentTotalBpi?: boolean;
}

export type ExecuteOptions = OptimizerOptions & {
  searchMode?: "fastest" | "flexible";
  maxRetries?: number;
  rng?: () => number;
};
