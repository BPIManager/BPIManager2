import { db } from "@/lib/db";

/**
 * 保存済み比較条件（savedComparisons）の読み書き。全メソッドが userId を所有者条件として受け取り、他人の行は読み書きできない。
 * `targets` は AnalyticsTarget[] を JSON 文字列で保持する（結果は保存しない）。
 */
class SavedComparisonsRepository {
  /** 指定ユーザーの保存済み比較を作成日時の古い順に取得する */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("savedComparisons")
      .selectAll()
      .where("userId", "=", userId)
      .orderBy("createdAt", "asc")
      .orderBy("id", "asc")
      .execute();
  }

  /** 保存済み比較を作成し、作成した行の ID を返す */
  async create(userId: string, name: string, targetsJson: string): Promise<number> {
    const result = await db
      .insertInto("savedComparisons")
      .values({ userId, name, targets: targetsJson })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  /**
   * 名前・条件を1つの UPDATE 文で更新する（指定したフィールドのみ）。
   *
   * @returns 該当行（本人のもの）が存在したか
   */
  async update(
    id: number,
    userId: string,
    fields: { name?: string; targetsJson?: string },
  ): Promise<boolean> {
    const set: { name?: string; targets?: string } = {};
    if (fields.name !== undefined) set.name = fields.name;
    if (fields.targetsJson !== undefined) set.targets = fields.targetsJson;
    if (Object.keys(set).length === 0) return await this.exists(id, userId);

    const result = await db
      .updateTable("savedComparisons")
      .set(set)
      .where("id", "=", id)
      .where("userId", "=", userId)
      .executeTakeFirst();
    // 値が変わらない更新は更新行数0になり得るため、存在確認で補う
    return Number(result.numUpdatedRows) > 0 || (await this.exists(id, userId));
  }

  /** 本人の保存済み比較を削除する。ダッシュボードのタブ設定は外部キーのCASCADEで消える */
  async delete(id: number, userId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("savedComparisons")
      .where("id", "=", id)
      .where("userId", "=", userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  /** 指定 ID のうち本人が所有するものだけを返す */
  async getOwnedIds(userId: string, ids: number[]): Promise<Set<number>> {
    if (ids.length === 0) return new Set();
    const rows = await db
      .selectFrom("savedComparisons")
      .select("id")
      .where("userId", "=", userId)
      .where("id", "in", ids)
      .execute();
    return new Set(rows.map((r) => r.id));
  }

  private async exists(id: number, userId: string): Promise<boolean> {
    const row = await db
      .selectFrom("savedComparisons")
      .select("id")
      .where("id", "=", id)
      .where("userId", "=", userId)
      .executeTakeFirst();
    return !!row;
  }
}

export const savedComparisonsRepo = new SavedComparisonsRepository();
