import type { RadarCategory } from "@/types/stats/radar";
import type { IBpiBasicSongData } from "@/types/songs/bpi";

export type OptimizerStrategy = "unplayed" | "played";

export interface SongOptimizerInput
  extends Pick<
    IBpiBasicSongData,
    "notes" | "kaidenAvg" | "wrScore" | "coef"
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
  radarElementFilter: RadarCategory[] | null;
  radarCategoryBpis: Partial<Record<RadarCategory, number>>;
  candidateLevels: number[];
  candidateDifficulties: string[];
  considerCurrentTotalBpi?: boolean;
}

export type ExecuteOptions = OptimizerOptions & {
  searchMode?: "fastest" | "flexible";
  rng?: () => number;
};

export type ScoredCandidate = {
  song: SongOptimizerInput;
  score: number;
  estimatedTargetBpi: number;
};

export type ResolvedTarget = {
  effectiveTarget: number;
  autoAdjustmentNote?: string;
  originalTarget?: number;
};

export type ExecutionState = {
  steps: OptimizationStep[];
  currentAccumulatedSum: number;
  currentTotalBpi: number;
  carryError: number;
  effectiveTarget: number;
  totalTargetSum: number;
  candidates: SongOptimizerInput[];
  strongCategories: Set<RadarCategory>;
};
