import { db } from "@/lib/db";
import { Database, NewUserStatusLog } from "@/types/db";
import { Kysely, Transaction } from "kysely";

/**
 * `userStatusLogs` テーブル（バージョン別の総合BPI・アリーナランク履歴）の
 * 書き込みを担当するリポジトリクラス。
 */
class UserStatusLogsRepository {
  /**
   * 指定ユーザー・バージョンの最新行から `arenaRank` を取得する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestArenaRank(
    trx: Transaction<Database>,
    userId: string,
    version: string,
  ) {
    return await trx
      .selectFrom("userStatusLogs")
      .select("arenaRank")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザー・バージョンの最新行から `totalBpi` を取得する。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestTotalBpi(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
  ) {
    return await trx
      .selectFrom("userStatusLogs")
      .select("totalBpi")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザー・バージョンでこれまでに記録された総合BPIの最高値を取得する。
   * 総合BPIの「下がらないラチェット」（{@link BpiCalculator.ratchetTotalBpi}）の
   * 基準値として使う。`getLatestTotalBpi`（最新1件）とは異なり、途中に
   * ラチェット導入前の下振れがあっても影響されない。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @returns 記録が無ければ `null`
   */
  async getMaxTotalBpi(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
  ): Promise<number | null> {
    const row = await trx
      .selectFrom("userStatusLogs")
      .select((eb) => eb.fn.max("totalBpi").as("maxTotalBpi"))
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
    return row?.maxTotalBpi != null ? Number(row.maxTotalBpi) : null;
  }

  /**
   * 指定期間内（`createdAt`が`start`〜`end`）のtotalBpiログを時系列順で取得する。
   * `insert`時点で既に{@link BpiCalculator.ratchetTotalBpi}適用済みの値のため、
   * シフト法での再計算をせずそのまま推移グラフ・現在値として使える。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   */
  async getLogsInRange(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    return await trx
      .selectFrom("userStatusLogs")
      .select(["totalBpi", "createdAt"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .orderBy("createdAt", "asc")
      .orderBy("id", "asc")
      .execute();
  }

  /**
   * 指定日時より前の最新totalBpiログを取得する（期間開始前のbaseline用）。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   */
  async getLatestBefore(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
    beforeDate: Date,
  ) {
    return await trx
      .selectFrom("userStatusLogs")
      .select(["totalBpi"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", "<", beforeDate)
      .orderBy("createdAt", "desc")
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 複数ユーザー分の、指定期間内（`createdAt`が`start`〜`end`）のtotalBpiログを
   * まとめて取得する（ライバル戦線セクション等、複数ユーザーを1クエリで扱う用途）。
   * {@link getLogsInRange}のバッチ版。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   */
  async getLogsInRangeBatch(
    trx: Kysely<Database> | Transaction<Database>,
    userIds: string[],
    version: string,
    start: Date,
    end: Date,
  ) {
    if (userIds.length === 0) return [];
    return await trx
      .selectFrom("userStatusLogs")
      .select(["userId", "totalBpi", "createdAt"])
      .where("userId", "in", userIds)
      .where("version", "=", version)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .orderBy("userId", "asc")
      .orderBy("createdAt", "asc")
      .orderBy("id", "asc")
      .execute();
  }

  /**
   * 複数ユーザー分の、指定日時より前の最新totalBpiログをまとめて取得する
   * （期間開始前のbaseline用）。{@link getLatestBefore}のバッチ版。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   */
  async getLatestBeforeBatch(
    trx: Kysely<Database> | Transaction<Database>,
    userIds: string[],
    version: string,
    beforeDate: Date,
  ) {
    if (userIds.length === 0) return [];
    // MySQLはDISTINCT ONが無いため、各ユーザーの最新行IDをmaxIdで求めてJOINする
    const latestIds = trx
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("userId", "in", userIds)
      .where("version", "=", version)
      .where("createdAt", "<", beforeDate)
      .groupBy("userId");

    return await trx
      .selectFrom("userStatusLogs")
      .innerJoin(latestIds.as("latest"), "latest.maxId", "userStatusLogs.id")
      .select(["userStatusLogs.userId", "userStatusLogs.totalBpi"])
      .execute();
  }

  /**
   * 複数ユーザー分の、指定バージョンにおける最新totalBpiログをまとめて取得する
   * （比較先バージョンのbaseline用）。{@link getLatestTotalBpi}のバッチ版。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   */
  async getLatestTotalBpiBatch(
    trx: Kysely<Database> | Transaction<Database>,
    userIds: string[],
    version: string,
  ) {
    if (userIds.length === 0) return [];
    const latestIds = trx
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("userId", "in", userIds)
      .where("version", "=", version)
      .groupBy("userId");

    return await trx
      .selectFrom("userStatusLogs")
      .innerJoin(latestIds.as("latest"), "latest.maxId", "userStatusLogs.id")
      .select(["userStatusLogs.userId", "userStatusLogs.totalBpi"])
      .execute();
  }

  /**
   * 指定バージョンにおける各ユーザーの最新 `userStatusLogs` 行の ID を取得するサブクエリを組み立てる。
   *
   * @param version - バージョン番号
   */
  latestPerUserSubquery(version: string) {
    return db
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");
  }

  /**
   * 指定ユーザーの全バージョンのBPI履歴（バージョンごとの最新1件）を取得する。
   *
   * @param userId - ユーザー ID
   */
  async getBpiHistoryByVersion(userId: string) {
    return await db
      .selectFrom("userStatusLogs as usl")
      .innerJoin(
        (eb) =>
          eb
            .selectFrom("userStatusLogs")
            .select(["version", (sub) => sub.fn.max("id").as("maxId")])
            .where("userId", "=", userId)
            .groupBy("version")
            .as("latest"),
        (join) => join.onRef("usl.id", "=", "latest.maxId"),
      )
      .select(["usl.version", "usl.totalBpi"])
      .execute();
  }

  /**
   * 指定ユーザー・バージョンの最新1件をJOIN用サブクエリとして組み立てる。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  latestRowSubquery(userId: string, version: string) {
    return db
      .selectFrom("userStatusLogs")
      .select(["userId", "totalBpi", "arenaRank", "id"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1);
  }

  /**
   * ステータスログを1件以上挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(
    trx: Transaction<Database>,
    values: NewUserStatusLog | NewUserStatusLog[],
  ) {
    await trx.insertInto("userStatusLogs").values(values).execute();
  }

  /**
   * 指定ユーザーの全ステータスログを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("userStatusLogs").where("userId", "=", userId).execute();
  }

  /**
   * バックアップ用にユーザーの全ステータスログを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("userStatusLogs")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * 指定バッチに紐づくステータスログを削除する。
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
      .deleteFrom("userStatusLogs")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }
}

export const userStatusLogsRepo = new UserStatusLogsRepository();
