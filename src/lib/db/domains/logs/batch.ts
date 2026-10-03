import { db } from "@/lib/db";
import { Database, NewTotalBPILog } from "@/types/db";
import { Transaction } from "kysely";


/**
 * ログ（logs）のバッチ単位の書き込み・最新バッチ判定を担当するリポジトリクラス。
 */
class LogBatchRepository {
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
   * トランザクション内で対象行をロックしつつ最新バッチIDを判定する。判定と削除をアトミックにし、間に割り込む TOCTOU 競合を防ぐ。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestBatchIdForUpdate(
    trx: Transaction<Database>,
    userId: string,
    version: string,
  ): Promise<string | undefined> {
    const row = await trx
      .selectFrom("logs")
      .select("batchId")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .forUpdate()
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
   * 手動スコア編集用の総合BPIスナップショットを upsert する。最新バッチが同じ batchId なら UPDATE、別なら INSERT にフォールバックする。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsert する内容（batchId は手動編集用の決定的 ID）
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
}

export const logBatchRepo = new LogBatchRepository();
