
import { Database, NewScore } from "@/types/db";
import { Transaction } from "kysely";

/**
 * `scores` テーブルへの書き込み（挿入・手動保存・バッチ/ユーザー単位の削除）を担当するリポジトリクラス。
 */
class ScoreWriteRepository {
  /**
   * スコアレコードを1件以上挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(trx: Transaction<Database>, values: NewScore | NewScore[]) {
    await trx.insertInto("scores").values(values).execute();
  }

  /**
   * 手動スコア編集用に、指定曲の行をupsertする。
   *
   * 対象曲の現在の最新行（`MAX(logId)`）が同じ`batchId`であれば、その行を
   * そのままUPDATEする（同日内の手動編集を1行にまとめ、レコード増加を抑える）。
   * 最新行が別のbatchId（CSVインポート等が間に挟まった場合）であれば、
   * `logId`基準の「最新」判定と矛盾しないよう新規INSERTにフォールバックする。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsertするスコア内容（`batchId`は手動編集用の決定的ID）
   */
  async upsertManual(
    trx: Transaction<Database>,
    params: {
      userId: string;
      songId: number;
      definitionId: number;
      version: string;
      batchId: string;
      exScore: number;
      bpi: number | null;
      clearState: string | null;
      missCount: number | null;
      lastPlayed: Date;
    },
  ) {
    const latest = await trx
      .selectFrom("scores")
      .select(["logId", "batchId"])
      .where("userId", "=", params.userId)
      .where("songId", "=", params.songId)
      .where("version", "=", params.version)
      .orderBy("logId", "desc")
      .limit(1)
      .executeTakeFirst();

    if (latest && latest.batchId === params.batchId) {
      await trx
        .updateTable("scores")
        .set({
          exScore: params.exScore,
          bpi: params.bpi,
          clearState: params.clearState,
          missCount: params.missCount,
          lastPlayed: params.lastPlayed,
        })
        .where("logId", "=", latest.logId)
        .execute();
      return;
    }

    await trx
      .insertInto("scores")
      .values({
        userId: params.userId,
        songId: params.songId,
        definitionId: params.definitionId,
        version: params.version,
        batchId: params.batchId,
        exScore: params.exScore,
        bpi: params.bpi,
        clearState: params.clearState,
        missCount: params.missCount,
        lastPlayed: params.lastPlayed,
      })
      .execute();
  }

  /**
   * 指定バッチに紐づくスコアレコードを削除する。
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
      .deleteFrom("scores")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ユーザーの全スコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("scores").where("userId", "=", userId).execute();
  }
}

export const scoreWriteRepo = new ScoreWriteRepository();
