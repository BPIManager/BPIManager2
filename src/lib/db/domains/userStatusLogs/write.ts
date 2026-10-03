
import { Database, NewUserStatusLog } from "@/types/db";
import { Transaction } from "kysely";

/**
 * `userStatusLogs` の書き込み（挿入・手動バッチ・削除）を担当するリポジトリクラス。
 */
class UserStatusLogsWriteRepository {
  /**
   * 手動スコア編集用に、その日の総合BPI・アリーナランクスナップショットを
   * upsertする。`logBatchRepo.upsertManualBatch`と同じ「現在の最新行が
   * 同じbatchIdの場合のみUPDATE、それ以外はINSERT」方針。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsertする内容（`batchId`は手動編集用の決定的ID）
   */
  async upsertManualBatch(
    trx: Transaction<Database>,
    params: {
      userId: string;
      version: string;
      batchId: string;
      totalBpi: number;
      arenaRank: string | null;
    },
  ) {
    const latest = await trx
      .selectFrom("userStatusLogs")
      .select(["id", "batchId"])
      .where("userId", "=", params.userId)
      .where("version", "=", params.version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();

    if (latest && latest.batchId === params.batchId) {
      await trx
        .updateTable("userStatusLogs")
        .set({
          totalBpi: params.totalBpi.toFixed(2),
          arenaRank: params.arenaRank,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .where("id", "=", latest.id)
        .execute();
      return;
    }

    await trx
      .insertInto("userStatusLogs")
      .values({
        userId: params.userId,
        totalBpi: params.totalBpi,
        arenaRank: params.arenaRank,
        version: params.version,
        batchId: params.batchId,
      })
      .execute();
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
    await trx
      .deleteFrom("userStatusLogs")
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

export const userStatusLogsWriteRepo = new UserStatusLogsWriteRepository();
