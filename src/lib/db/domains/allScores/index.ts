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
   * `aggregates/songRanking`（`users`横断のクロスドメイン複合ビュー）への
   * 委譲であり、本来は`domains → aggregates`の逆方向依存になる（#166も参照）。
   * `scores`ドメイン側の同名メソッドと合わせて解消は別issueで検討する。
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
