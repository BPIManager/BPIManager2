import { db } from "@/lib/db";
import type { Transaction } from "kysely";
import { v4 as uuidv4 } from "uuid";
import type { Database } from "@/types/db";
import { BpiCalculator } from "@/lib/bpi";
import { BpiOptimizerConstants } from "@/lib/bpi/optimizer/constants";
import type {
  ColdCategoryAdvisory,
  OptimizationResult,
  OptimizationStep,
} from "@/types/bpi-optimizer";
import type { IBpiBasicSongData } from "@/types/songs/bpi";
import type { RadarCategory } from "@/types/stats/radar";

function roundBpi(value: number): number {
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

interface GoalRow {
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

const GOAL_COLUMNS = [
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

function toReportData(
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

function toStoredGoal(
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

function stepToRow(reportId: string, step: OptimizationStep) {
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

function rowToStep(row: {
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

async function insertSteps(
  trx: Transaction<Database>,
  reportId: string,
  steps: OptimizationStep[],
) {
  if (steps.length === 0) return;
  await trx
    .insertInto("optimizeGoalSteps")
    .values(steps.map((s) => stepToRow(reportId, s)))
    .execute();
}

async function getStepsByReportIds(
  reportIds: string[],
): Promise<Map<string, OptimizationStep[]>> {
  if (reportIds.length === 0) return new Map();
  const rows = await db
    .selectFrom("optimizeGoalSteps as s")
    .leftJoin("songs as sg", "sg.songId", "s.songId")
    .leftJoin("songDef as sd", (join) =>
      join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
    )
    .select([
      "s.reportId",
      "s.rank",
      "s.songId",
      "sg.title",
      "sg.difficulty",
      "sg.difficultyLevel",
      "sg.notes",
      "sd.kaidenAvg",
      "sd.wrScore",
      "sd.coef",
      "sd.mu",
      "sd.sigma",
      "sd.residualVar",
      "s.fromExScore",
      "s.toExScore",
      "s.exScoreGap",
      "s.bpiGain",
      "s.cumulativeTotalBpi",
      "s.isUnplayed",
      "s.radarCategory",
      "s.isRadarStrength",
    ])
    .where("s.reportId", "in", reportIds)
    .orderBy("s.reportId", "asc")
    .orderBy("s.rank", "asc")
    .execute();

  const map = new Map<string, OptimizationStep[]>();
  for (const row of rows) {
    const list = map.get(row.reportId) ?? [];
    list.push(rowToStep(row));
    map.set(row.reportId, list);
  }
  return map;
}

function goalValues(
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

/**
 * BPI最適化機能の保存目標（`optimizeGoals`・曲別の`optimizeGoalSteps`）の
 * 読み書きを担当するリポジトリクラス。曲別データは正規化テーブルに持つが、
 * 呼び出し元へは従来通り`reportData: OptimizationResult`の形にまとめて返す。
 */
class BpiOptimizerRepository {
  /**
   * 最適化結果（目標）を保存する
   */
  async saveMemo(
    userId: string,
    targetBpi: number,
    reportData: OptimizationResult,
    kind: "auto" | "custom" = "auto",
  ): Promise<string> {
    const reportId = uuidv4();
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("optimizeGoals")
        .values(goalValues(reportId, userId, targetBpi, reportData, kind))
        .execute();
      await insertSteps(trx, reportId, reportData.steps);
    });
    return reportId;
  }

  /**
   * ユーザーの目標一覧を保存日時の降順で取得する
   */
  async getMemosByUserId(userId: string): Promise<StoredOptimizeGoal[]> {
    const goals = await db
      .selectFrom("optimizeGoals")
      .select(GOAL_COLUMNS)
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();
    if (goals.length === 0) return [];

    const stepsByReportId = await getStepsByReportIds(
      goals.map((g) => g.reportId),
    );
    return goals.map((g) =>
      toStoredGoal(g, userId, stepsByReportId.get(g.reportId) ?? []),
    );
  }

  /**
   * reportId(UUID)からユーザーを問わず目標1件を取得する。
   * 「曲目をシェア」機能でreportIdを受け取った側が、共有元のuserIdを
   * 知らなくても曲目をインポートできるようにするため。
   */
  async getMemoByReportId(
    reportId: string,
  ): Promise<StoredOptimizeGoal | null> {
    const goal = await db
      .selectFrom("optimizeGoals")
      .select([...GOAL_COLUMNS, "userId"])
      .where("reportId", "=", reportId)
      .executeTakeFirst();
    if (!goal) return null;

    const stepsByReportId = await getStepsByReportIds([reportId]);
    return toStoredGoal(goal, goal.userId, stepsByReportId.get(reportId) ?? []);
  }

  /**
   * 既存の目標を上書き更新する（保存済みの目標の編集）。
   * 対象がuserIdの所有物でない場合は何もせず`false`を返す。
   */
  async updateMemo(
    userId: string,
    reportId: string,
    targetBpi: number,
    reportData: OptimizationResult,
    kind: "auto" | "custom",
  ): Promise<boolean> {
    return await db.transaction().execute(async (trx) => {
      const {
        reportId: _reportId,
        userId: _userId,
        ...updatable
      } = goalValues(reportId, userId, targetBpi, reportData, kind);
      const result = await trx
        .updateTable("optimizeGoals")
        .set(updatable)
        .where("userId", "=", userId)
        .where("reportId", "=", reportId)
        .executeTakeFirst();

      if (Number(result.numUpdatedRows) === 0) return false;

      // 曲目の入れ替え（追加・削除・順序変更）に対応するため、既存stepを
      // 全削除してから保存内容で作り直す（reportData自体が全体を上書きする値のため）
      await trx
        .deleteFrom("optimizeGoalSteps")
        .where("reportId", "=", reportId)
        .execute();
      await insertSteps(trx, reportId, reportData.steps);
      return true;
    });
  }

  /**
   * 特定の目標を削除する（曲別データは`optimizeGoalSteps`のFK CASCADEで連動削除される）
   */
  async deleteMemo(userId: string, reportId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("optimizeGoals")
      .where("userId", "=", userId)
      .where("reportId", "=", reportId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

export const bpiOptimizerRepo = new BpiOptimizerRepository();
