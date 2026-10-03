import { db } from "@/lib/db";
import type { Transaction } from "kysely";
import { v4 as uuidv4 } from "uuid";
import type { Database } from "@/types/db";

import type { OptimizationResult, OptimizationStep } from "@/types/bpi-optimizer";

import { StoredOptimizeGoal, GOAL_COLUMNS, toStoredGoal, stepToRow, rowToStep, goalValues } from "@/lib/db/domains/bpiOptimizer/mapping";

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

/**
 * 保存目標（optimizeGoals・曲別の optimizeGoalSteps）の読み書き。曲別データは正規化テーブルに持つが、呼び出し元へは reportData: OptimizationResult の形で返す。
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
   * reportId（UUID）からユーザーを問わず目標1件を取得する。共有された曲目を、共有元の userId を知らずにインポートできるようにするため。
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
