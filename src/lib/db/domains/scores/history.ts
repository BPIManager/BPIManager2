import { db } from "@/lib/db";

/**
 * `scores` テーブルの履歴・最終プレイ日ベースの参照を担当するリポジトリクラス。
 */
class ScoreHistoryRepository {
  /**
   * 指定範囲の前後にある lastPlayed 基準のスコアレコードを取得する（日付ナビゲーション用）。logs の getRangeNavigation から委譲される。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param range - ナビゲーション基準となる UTC 範囲
   * @returns { prevDate, nextDate }（前後のレコード）
   */
  async getLastPlayedNavigation(
    userId: string,
    version: string,
    range: { start: Date; end: Date },
  ) {
    const { start, end } = range;

    const [prevRow, nextRow] = await Promise.all([
      db
        .selectFrom("scores")
        .select(["lastPlayed"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("lastPlayed", "<", start)
        .orderBy("lastPlayed", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("scores")
        .select(["lastPlayed"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("lastPlayed", ">", end)
        .orderBy("lastPlayed", "asc")
        .executeTakeFirst(),
    ]);

    return {
      prevDate: prevRow,
      nextDate: nextRow,
    };
  }

  /**
   * 指定楽曲の全スコア登録履歴を、プレイ日時の新しい順で取得する。
   *
   * @param userId - ユーザー ID
   * @param songId - 楽曲 ID
   */
  async getHistoryForSong(userId: string, songId: number) {
    return await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId)
      .where("songId", "=", songId)
      .orderBy("lastPlayed", "desc")
      .execute();
  }

  /**
   * バックアップ用にユーザーの全スコアレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }
}

export const scoreHistoryRepo = new ScoreHistoryRepository();
