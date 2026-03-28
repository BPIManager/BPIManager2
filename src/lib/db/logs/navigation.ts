import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";

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

    return {
      start: baseDate.startOf(unit).utc().toDate(),
      end: baseDate.endOf(unit).utc().toDate(),
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
}

export const navigationRepo = new LogNavigationRepository();
