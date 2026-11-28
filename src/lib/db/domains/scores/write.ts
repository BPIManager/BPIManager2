
import { db } from "@/lib/db";
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
   * 手動スコア編集用に指定曲の行を upsert する。最新行が同じ batchId なら UPDATE、別なら INSERT にフォールバックする。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsert するスコア内容（batchId は手動編集用の決定的 ID）
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
      /** 使用オプション。省略（undefined）なら、同じ batchId の行を更新するときは今の値を残す */
      useOption?: string | null;
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
          ...(params.useOption !== undefined ? { useOption: params.useOption } : {}),
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
        useOption: params.useOption ?? null,
      })
      .execute();
  }

  /**
   * 記録の使用オプションを更新する（履歴タブ、#708）。本人の記録だけを更新する
   *
   * @returns 更新できたか（logId が無い、または他人の記録なら false）
   */
  async updateUseOption(userId: string, logId: number, useOption: string | null): Promise<boolean> {
    const r = await db.updateTable("scores").set({ useOption }).where("logId", "=", logId).where("userId", "=", userId).executeTakeFirst();
    return Number(r.numUpdatedRows) > 0;
  }

  /**
   * CSV 取り込みで、同じプレーの手動登録の記録を、新しい記録を作らずに更新する（#711）。EX・使用オプションは変えない。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param logId - 更新する記録
   * @param values - CSV のミスカウント・ランプ・最終プレー日時
   */
  async updateFromSamePlay(
    trx: Transaction<Database>,
    logId: number,
    values: { clearState: string | null; missCount: number | null; lastPlayed: Date },
  ) {
    await trx.updateTable("scores").set(values).where("logId", "=", logId).execute();
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
