import { db } from "@/lib/db";
import { OptimizationResult } from "@/types/bpi-optimizer";
import { v4 as uuidv4 } from "uuid";

/**
 * BPI最適化機能の保存メモ（`optimizeMemo` テーブル）の読み書きを担当するリポジトリクラス。
 */
class BpiOptimizerRepository {
  /**
   * 最適化結果（メモ）を保存する
   */
  async saveMemo(
    userId: string,
    targetBpi: number,
    reportData: OptimizationResult,
  ) {
    const reportId = uuidv4();

    await db
      .insertInto("optimizeMemo")
      .values({
        reportId,
        userId,
        targetBpi,
        reportData: JSON.stringify(reportData),
      })
      .execute();

    return reportId;
  }

  /**
   * ユーザーのメモ一覧を保存日時の降順で取得する
   */
  async getMemosByUserId(userId: string) {
    const rows = await db
      .selectFrom("optimizeMemo")
      .select(["reportId", "targetBpi", "reportData", "createdAt"])
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    return rows.map((row) => ({
      ...row,
      reportData: JSON.parse(row.reportData) as OptimizationResult,
    }));
  }

  /**
   * 特定のメモを削除する
   */
  async deleteMemo(userId: string, reportId: string) {
    const result = await db
      .deleteFrom("optimizeMemo")
      .where("userId", "=", userId)
      .where("reportId", "=", reportId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

export const bpiOptimizerRepo = new BpiOptimizerRepository();
