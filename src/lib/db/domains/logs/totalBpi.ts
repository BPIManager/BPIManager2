import { db } from "@/lib/db";

import { sql, Expression } from "kysely";


/**
 * ログ（logs）の総合BPI・件数の参照を担当するリポジトリクラス。
 */
class LogTotalBpiRepository {
  /**
   * 指定したユーザー・バージョンの最新のバッチログを取得する
   */
  async getLatestTotalBpi(userId: string, version: string) {
    return await db
      .selectFrom("logs")
      .select("totalBpi")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 全ユーザー・全バージョンの最新totalBpiを一括取得する（サイト統計の
   * バージョン別ヒストグラム集計用）。
   */
  async getLatestTotalBpiPerUserAllVersions() {
    return await db
      .with("latest", (eb) =>
        eb
          .selectFrom("logs")
          .select(["userId", "version", (e) => e.fn.max("id").as("maxId")])
          .groupBy(["userId", "version"]),
      )
      .selectFrom("logs as l")
      .innerJoin("latest", (join) => join.onRef("latest.maxId", "=", "l.id"))
      .select(["l.version", "l.totalBpi"])
      .execute();
  }

  /**
   * ログ（バッチ）の総件数を取得する。`onJstDate` 指定時はその日(JST)に作成されたログ件数に絞り込む。
   *
   * @param onJstDate - `DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))` と比較するSQL式
   */
  async getCount(onJstDate?: Expression<unknown>): Promise<number> {
    let query = db
      .selectFrom("logs")
      .select((eb) => eb.fn.count("id").as("count"));
    if (onJstDate) {
      query = query.where(
        sql`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
        "=",
        onJstDate,
      );
    }
    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }
}

export const logTotalBpiRepo = new LogTotalBpiRepository();
