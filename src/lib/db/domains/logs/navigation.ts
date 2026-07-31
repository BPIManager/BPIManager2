import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { Database, NewTotalBPILog } from "@/types/db";
import { Transaction, sql, Expression } from "kysely";

/**
 * スコアログの日付ナビゲーション・バッチ検索を担当するリポジトリクラス。
 */
class LogNavigationRepository {
  /**
   * 指定した JST 日付文字列から指定単位の UTC 範囲を計算する。
   *
   * @param dateString - JST の日付文字列（例: `"2024-01-15"`）
   * @param unit - 範囲の単位（`"day"` | `"week"` | `"month"`、デフォルト: `"day"`）
   * @returns `{ start, end, label, unit }` の UTC 範囲オブジェクト
   */
  getJstRange(dateString: string, unit: "day" | "week" | "month" = "day") {
    const baseDate = dayjs.tz(dateString);
    const startFn = unit === "week" ? "isoWeek" : unit;
    const endFn = unit === "week" ? "isoWeek" : unit;

    return {
      start: baseDate.startOf(startFn as Parameters<typeof baseDate.startOf>[0]).utc().toDate(),
      end: baseDate.endOf(endFn as Parameters<typeof baseDate.endOf>[0]).utc().toDate(),
      label: baseDate.format("YYYY-MM-DD"),
      unit,
    };
  }

  /**
   * 指定範囲の前後に存在するログまたはスコアレコードを取得する（日付ナビゲーション用）。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param range - ナビゲーション基準となる UTC 範囲
   * @param groupedBy - 日付列の基準（`"createdAt"`: ログ、`"lastPlayed"`: スコア）
   * @returns `{ prevDate, nextDate }`（前後のレコード）
   */
  async getRangeNavigation(
    userId: string,
    version: string,
    range: { start: Date; end: Date; unit: string },
    groupedBy: "createdAt" | "lastPlayed" = "createdAt",
  ) {
    const { start, end } = range;
    const isLastPlayed = groupedBy === "lastPlayed";
    const dateCol = isLastPlayed ? "lastPlayed" : "createdAt";
    const columns: ("lastPlayed" | "createdAt" | "totalBpi")[] = isLastPlayed
      ? [dateCol]
      : [dateCol, "totalBpi"];
    const table = isLastPlayed ? "scores" : "logs";

    const [prevRow, nextRow] = await Promise.all([
      db
        .selectFrom(table)
        .select(columns)
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where(dateCol, "<", start)
        .orderBy(dateCol, "desc")
        .executeTakeFirst(),
      db
        .selectFrom(table)
        .select(columns)
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where(dateCol, ">", end)
        .orderBy(dateCol, "asc")
        .executeTakeFirst(),
    ]);

    return {
      prevDate: prevRow,
      nextDate: nextRow,
    };
  }

  /**
   * 現在のバッチの前後に存在するバッチを取得する（バッチナビゲーション用）。
   *
   * `range` を指定した場合は `getRangeNavigation` も同時に取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param currentCreatedAt - 現在のバッチの作成日時
   * @param range - 範囲ナビゲーション用の UTC 範囲（省略可）
   * @returns `{ prev, next, prevDate?, nextDate? }`
   */
  async getBatchNavigation(
    userId: string,
    version: string,
    currentCreatedAt: Date,
    range?: { start: Date; end: Date; unit: "day" | "week" | "month" },
  ) {
    const [prevBatch, nextBatch, rangeNav] = await Promise.all([
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", "<", currentCreatedAt)
        .orderBy("createdAt", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", ">", currentCreatedAt)
        .orderBy("createdAt", "asc")
        .executeTakeFirst(),
      range
        ? this.getRangeNavigation(userId, version, range)
        : Promise.resolve({ prevDate: null, nextDate: null }),
    ]);

    return {
      prev: prevBatch || null,
      next: nextBatch || null,
      ...rangeNav,
    };
  }

  /**
   * 特定のバッチIDからログ情報を取得します
   */
  async findBatchById(batchId: string) {
    return await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("batchId", "=", batchId)
      .executeTakeFirst();
  }

  /**
   * 特定のバッチIDとユーザーIDからログ情報を取得します（所有者確認用）
   */
  async findBatchByIdAndUser(batchId: string, userId: string) {
    return await db
      .selectFrom("logs")
      .select(["batchId"])
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .executeTakeFirst();
  }

  /**
   * ユーザーの全ログレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("logs").where("userId", "=", userId).execute();
  }

  /**
   * 指定バッチに紐づくログレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param batchId - バッチ ID
   */
  async deleteByBatch(
    trx: Transaction<Database>,
    userId: string,
    batchId: string,
  ) {
    await trx
      .deleteFrom("logs")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * バックアップ用にユーザーの全ログレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("logs")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ログレコードを1件以上挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(
    trx: Transaction<Database>,
    values: NewTotalBPILog | NewTotalBPILog[],
  ) {
    await trx.insertInto("logs").values(values).execute();
  }

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
   * 指定されたJSTの期間内に含まれる全てのバッチを取得します
   */
  async findBatchesInRange(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    return await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .orderBy("createdAt", "asc")
      .execute();
  }

  /**
   * 指定バージョンの最新バッチログを基準に、目標BPIとの差が近い順にユーザーIDを取得する。
   *
   * @param version - バージョン番号
   * @param excludeUserId - 除外するユーザーID（基準ユーザー自身）
   * @param targetBpi - 比較対象の総合BPI
   * @param limit - 取得件数上限
   */
  async getUserIdsOrderedByBpiDistance(
    version: string,
    excludeUserId: string,
    targetBpi: number,
    limit: number,
  ): Promise<string[]> {
    const rows = await db
      .selectFrom("logs as l")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("logs")
            .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
            .where("version", "=", version)
            .groupBy("userId")
            .as("latest"),
        (join) => join.onRef("latest.maxId", "=", "l.id"),
      )
      .select("l.userId")
      .where("l.userId", "!=", excludeUserId)
      .orderBy(sql<number>`ABS(l.totalBpi - ${targetBpi})`, "asc")
      .limit(limit)
      .execute();

    return rows.map((r) => r.userId);
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

export const navigationRepo = new LogNavigationRepository();
