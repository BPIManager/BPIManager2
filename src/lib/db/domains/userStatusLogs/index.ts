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
