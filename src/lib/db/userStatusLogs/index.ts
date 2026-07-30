import { Database, NewUserStatusLog } from "@/types/db";
import { Transaction } from "kysely";

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
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestTotalBpi(
    trx: Transaction<Database>,
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
