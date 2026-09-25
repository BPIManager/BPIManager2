import { db } from "@/lib/db";
import { Database, NewAllScores } from "@/types/db";
import { Transaction } from "kysely";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore";
import { getSongRankingFromTable } from "@/lib/db/aggregates/songRanking";

/**
 * 全難易度スコア（`allScores` テーブル）の参照を担当するリポジトリクラス。
 */
class allScoresRepository {
  /**
   * 指定ユーザー・バージョンの `allScores` テーブルから、曲ごとの最新スコアを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestAllScores(userId: string, version: string) {
    return await db
      .selectFrom("allScores")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "allScores",
          userId,
          version,
        }).as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "allScores.logId"),
      )
      .selectAll("allScores")
      .execute();
  }

  /**
   * 指定楽曲のグローバルランキングを取得する（allScores テーブル使用）
   *
   * `users`と横断する集計のため、実体は`aggregates/songRanking`に委譲する。
   *
   * @param songId - 楽曲 ID
   * @param version - バージョン番号
   * @param viewerId - 閲覧者のユーザー ID（自分自身の判定に使用）
   */
  async getAllSongRanking(songId: number, version: string, viewerId: string) {
    return getSongRankingFromTable({
      table: "allScores",
      songId,
      version,
      viewerId,
    });
  }

  /**
   * 指定楽曲のスコア履歴をバージョンごとにグループ化して取得する。
   *
   * @param userId - ユーザー ID
   * @param songId - 楽曲 ID
   * @returns バージョン文字列をキー、スコアレコード配列を値とするオブジェクト
   */
  async getScoreHistory(userId: string, songId: string) {
    const history = await db
      .selectFrom("allScores")
      .where("userId", "=", userId as string)
      .where("songId", "=", Number(songId))
      .orderBy("lastPlayed", "desc")
      .selectAll()
      .execute();

    return history.reduce(
      (acc, record) => {
        const v = record.version || "unknown";
        if (!acc[v]) {
          acc[v] = [];
        }
        acc[v].push(record);
        return acc;
      },
      {} as Record<string, typeof history>,
    );
  }

  /**
   * 全難易度スコアレコードを1件以上挿入する。1000件ごとにチャンク分割して挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(
    trx: Transaction<Database>,
    values: NewAllScores | NewAllScores[],
  ) {
    const records = Array.isArray(values) ? values : [values];
    if (records.length === 0) return;

    for (let i = 0; i < records.length; i += 1000) {
      const chunk = records.slice(i, i + 1000);
      await trx.insertInto("allScores").values(chunk).execute();
    }
  }

  /**
   * 指定ユーザー・バージョンの`allScores`テーブルにおける最新の`batchId`を取得する。
   *
   * ☆10以下の楽曲（`allScores`ドメインのみ）の手動編集では`logs`テーブルに
   * 一切書き込まれず`navigationRepo.getLatestBatchId`で既存の手動バッチを
   * 検出できないため、`allScores`自体から直接判定する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestBatchId(
    userId: string,
    version: string,
  ): Promise<string | undefined> {
    const row = await db
      .selectFrom("allScores")
      .select("batchId")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("logId", "desc")
      .limit(1)
      .executeTakeFirst();
    return row?.batchId ?? undefined;
  }

  /**
   * 手動スコア編集用に、指定曲の行をupsertする。`scoresRepo.upsertManual`と
   * 同じ「現在の最新行が同じbatchIdの場合のみUPDATE、それ以外はINSERT」方針。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsertするスコア内容（`batchId`は手動編集用の決定的ID）
   */
  async upsertManual(
    trx: Transaction<Database>,
    params: {
      userId: string;
      songId: number;
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
      .selectFrom("allScores")
      .select(["logId", "batchId"])
      .where("userId", "=", params.userId)
      .where("songId", "=", params.songId)
      .where("version", "=", params.version)
      .orderBy("logId", "desc")
      .limit(1)
      .executeTakeFirst();

    if (latest && latest.batchId === params.batchId) {
      await trx
        .updateTable("allScores")
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
      .insertInto("allScores")
      .values({
        userId: params.userId,
        songId: params.songId,
        definitionId: null,
        version: params.version,
        batchId: params.batchId,
        exScore: params.exScore,
        bpi: params.bpi,
        clearState: params.clearState,
        missCount: params.missCount,
        lastPlayed: params.lastPlayed,
      } as NewAllScores)
      .execute();
  }

  /**
   * 指定バッチに紐づく全難易度スコアレコードを削除する。
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
      .deleteFrom("allScores")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ユーザーの全難易度スコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("allScores").where("userId", "=", userId).execute();
  }

  /**
   * バックアップ用にユーザーの全難易度スコアレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("allScores")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }
}

export const allScoresRepo = new allScoresRepository();
