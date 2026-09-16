import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { Database, NewTotalBPILog } from "@/types/db";
import { Transaction, sql, Expression } from "kysely";
import { scoresRepo } from "@/lib/db/domains/scores";

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
    if (groupedBy === "lastPlayed") {
      return scoresRepo.getLastPlayedNavigation(userId, version, range);
    }

    const { start, end } = range;

    const [prevRow, nextRow] = await Promise.all([
      db
        .selectFrom("logs")
        .select(["createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", "<", start)
        .orderBy("createdAt", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select(["createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", ">", end)
        .orderBy("createdAt", "asc")
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
      .select(["batchId", "version"])
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザー・バージョンの最新バッチIDを取得する。
   * バッチ削除を最新バッチのみに制限するための判定に使う。
   */
  async getLatestBatchId(
    userId: string,
    version: string,
  ): Promise<string | undefined> {
    const row = await db
      .selectFrom("logs")
      .select("batchId")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
    return row?.batchId;
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
   * 手動スコア編集用に、その日の総合BPIスナップショットをupsertする。
   *
   * 現在の最新バッチ（`id`最大）が同じ`batchId`であれば、その行をUPDATEする
   * （同日内の複数回の手動編集を1行にまとめる）。最新バッチが別のbatchId
   * （間にCSVインポート等が挟まった場合）であれば、`id`基準の「最新」判定と
   * 矛盾しないよう新規INSERTにフォールバックする。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsertする内容（`batchId`は手動編集用の決定的ID）
   */
  async upsertManualBatch(
    trx: Transaction<Database>,
    params: { userId: string; version: string; batchId: string; totalBpi: number },
  ) {
    const latest = await trx
      .selectFrom("logs")
      .select(["id", "batchId"])
      .where("userId", "=", params.userId)
      .where("version", "=", params.version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();

    if (latest && latest.batchId === params.batchId) {
      await trx
        .updateTable("logs")
        .set({ totalBpi: params.totalBpi, createdAt: new Date() })
        .where("id", "=", latest.id)
        .execute();
      return;
    }

    await trx
      .insertInto("logs")
      .values({
        userId: params.userId,
        totalBpi: params.totalBpi,
        version: params.version,
        batchId: params.batchId,
      })
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
