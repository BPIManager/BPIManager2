


import { BpiCalculator } from "@/lib/bpi";
import { BpiOptimizerConstants } from "@/lib/bpi/optimizer/constants";
import type { ColdCategoryAdvisory, OptimizationResult, OptimizationStep } from "@/types/bpi-optimizer";
import type { IBpiBasicSongData } from "@/types/songs/bpi";
import type { RadarCategory } from "@/types/stats/radar";

export function roundBpi(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface StoredOptimizeGoal {
  reportId: string;
  userId: string;
  targetBpi: number | null;
  reportData: OptimizationResult;
  kind: "auto" | "custom";
  createdAt: Date;
}

export interface GoalRow {
  reportId: string;
  targetBpi: number | null;
  kind: string;
  createdAt: Date;
  currentTotalBpi: number;
  targetTotalBpi: number;
  achievable: number;
  alreadyAchieved: number;
  totalSongCount: number;
  originalTargetTotalBpi: number | null;
  autoAdjustmentNote: string | null;
  maxAchievableBpi: number | null;
  coldCategories: string | null;
}

export const GOAL_COLUMNS = [
  "reportId",
  "targetBpi",
  "kind",
  "createdAt",
  "currentTotalBpi",
  "targetTotalBpi",
  "achievable",
  "alreadyAchieved",
  "totalSongCount",
  "originalTargetTotalBpi",
  "autoAdjustmentNote",
  "maxAchievableBpi",
  "coldCategories",
] as const;

export function toReportData(
  goal: GoalRow,
  steps: OptimizationStep[],
): OptimizationResult {
  return {
    steps,
    currentTotalBpi: goal.currentTotalBpi,
    targetTotalBpi: goal.targetTotalBpi,
    achievable: goal.achievable === 1,
    alreadyAchieved: goal.alreadyAchieved === 1,
    totalSongCount: goal.totalSongCount,
    originalTargetTotalBpi: goal.originalTargetTotalBpi ?? undefined,
    autoAdjustmentNote: goal.autoAdjustmentNote ?? undefined,
    maxAchievableBpi: goal.maxAchievableBpi ?? undefined,
    coldCategories: goal.coldCategories
      ? (JSON.parse(goal.coldCategories) as ColdCategoryAdvisory[])
      : undefined,
  };
}

export function toStoredGoal(
  goal: GoalRow,
  userId: string,
  steps: OptimizationStep[],
): StoredOptimizeGoal {
  return {
    reportId: goal.reportId,
    userId,
    targetBpi: goal.targetBpi,
    kind: (goal.kind || "auto") as "auto" | "custom",
    createdAt: goal.createdAt,
    reportData: toReportData(goal, steps),
  };
}

export function stepToRow(reportId: string, step: OptimizationStep) {
  return {
    reportId,
    rank: step.rank,
    songId: step.songId,
    fromExScore: step.fromExScore,
    toExScore: step.toExScore,
    exScoreGap: step.exScoreGap,
    bpiGain: step.bpiGain,
    cumulativeTotalBpi: step.cumulativeTotalBpi,
    isUnplayed: step.isUnplayed ? 1 : 0,
    radarCategory: step.radarCategory,
    isRadarStrength: step.isRadarStrength ? 1 : 0,
  };
}

export function rowToStep(row: {
  rank: number;
  songId: number;
  title: string | null;
  difficulty: string | null;
  difficultyLevel: number | null;
  notes: number | null;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
  fromExScore: number | null;
  toExScore: number;
  exScoreGap: number;
  bpiGain: number;
  cumulativeTotalBpi: number;
  isUnplayed: number;
  radarCategory: string | null;
  isRadarStrength: number;
}): OptimizationStep {
  const song: IBpiBasicSongData = {
    notes: row.notes ?? 0,
    kaidenAvg: row.kaidenAvg,
    wrScore: row.wrScore,
    coef: row.coef,
    mu: row.mu,
    sigma: row.sigma,
    residualVar: row.residualVar,
  };
  // fromBpiは探索エンジン(engine.ts)の挙動に合わせ非丸め、toBpiは丸める
  const fromBpi =
    row.fromExScore != null
      ? (BpiCalculator.calc(row.fromExScore, song) ??
        BpiOptimizerConstants.BPI_FLOOR)
      : BpiOptimizerConstants.BPI_FLOOR;
  const toBpi = roundBpi(
    BpiCalculator.calc(row.toExScore, song) ?? BpiOptimizerConstants.BPI_FLOOR,
  );

  return {
    rank: row.rank,
    songId: row.songId,
    // songsから見つからない場合（楽曲が完全に削除された等の稀なケース）のフォールバック
    title: row.title ?? "(削除済み楽曲)",
    difficulty: row.difficulty ?? "",
    difficultyLevel: row.difficultyLevel ?? 0,
    notes: row.notes ?? 0,
    fromBpi,
    toBpi,
    fromExScore: row.fromExScore,
    toExScore: row.toExScore,
    exScoreGap: row.exScoreGap,
    bpiGain: row.bpiGain,
    cumulativeTotalBpi: row.cumulativeTotalBpi,
    isUnplayed: row.isUnplayed === 1,
    radarCategory: row.radarCategory as RadarCategory | null,
    isRadarStrength: row.isRadarStrength === 1,
  };
}

export function goalValues(
  reportId: string,
  userId: string,
  targetBpi: number,
  reportData: OptimizationResult,
  kind: "auto" | "custom",
) {
  return {
    reportId,
    userId,
    targetBpi,
    kind,
    currentTotalBpi: reportData.currentTotalBpi,
    targetTotalBpi: reportData.targetTotalBpi,
    achievable: reportData.achievable ? 1 : 0,
    alreadyAchieved: reportData.alreadyAchieved ? 1 : 0,
    totalSongCount: reportData.totalSongCount,
    originalTargetTotalBpi: reportData.originalTargetTotalBpi ?? null,
    autoAdjustmentNote: reportData.autoAdjustmentNote ?? null,
    maxAchievableBpi: reportData.maxAchievableBpi ?? null,
    coldCategories: reportData.coldCategories
      ? JSON.stringify(reportData.coldCategories)
      : null,
  };
}
