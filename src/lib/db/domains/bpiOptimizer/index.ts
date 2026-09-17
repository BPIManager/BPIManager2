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
    kind: "auto" | "custom" = "auto",
  ) {
    const reportId = uuidv4();

    await db
      .insertInto("optimizeMemo")
      .values({
        reportId,
        userId,
        targetBpi,
        reportData: JSON.stringify(reportData),
        kind,
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
      .select(["reportId", "targetBpi", "reportData", "kind", "createdAt"])
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    return rows.map((row) => ({
      ...row,
      // kind列追加(#472)前に保存された行はkindが空文字/未設定のことがあるため、
      // 読み取り側でも自動生成プラン扱いにフォールバックする
      kind: (row.kind || "auto") as "auto" | "custom",
      reportData: JSON.parse(row.reportData) as OptimizationResult,
    }));
  }

  /**
   * reportId(UUID)からユーザーを問わずメモ1件を取得する。
   * 「曲目をシェア」機能でreportIdを受け取った側が、共有元のuserIdを
   * 知らなくても曲目をインポートできるようにするため。
   */
  async getMemoByReportId(reportId: string) {
    const row = await db
      .selectFrom("optimizeMemo")
      .select(["reportId", "userId", "targetBpi", "reportData", "kind", "createdAt"])
      .where("reportId", "=", reportId)
      .executeTakeFirst();

    if (!row) return null;

    return {
      ...row,
      kind: (row.kind || "auto") as "auto" | "custom",
      reportData: JSON.parse(row.reportData) as OptimizationResult,
    };
  }

  /**
   * 既存のメモを上書き更新する（保存済みの目標の編集）。
   * 対象がuserIdの所有物でない場合は何もせず`false`を返す。
   */
  async updateMemo(
    userId: string,
    reportId: string,
    targetBpi: number,
    reportData: OptimizationResult,
    kind: "auto" | "custom",
  ) {
    const result = await db
      .updateTable("optimizeMemo")
      .set({
        targetBpi,
        reportData: JSON.stringify(reportData),
        kind,
      })
      .where("userId", "=", userId)
      .where("reportId", "=", reportId)
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
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
