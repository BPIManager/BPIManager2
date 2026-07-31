import { db } from "@/lib/db";

/**
 * `allSongs` テーブル（全難易度楽曲マスタ、`allScores` のFK親）の参照を担当するリポジトリクラス。
 *
 * `allSongs` を参照する処理は、他ドメインから直接クエリせず本リポジトリ経由で行う方針とする。
 */
class AllSongsRepository {
  /**
   * 全難易度の楽曲マスタを取得する。
   *
   * @returns 楽曲 ID・タイトル・ノーツ数・難易度・BPM・textage を含む配列
   */
  async getAllLevelMaster(): Promise<
    {
      songId: number;
      title: string;
      notes: number;
      difficulty: string;
      difficultyLevel: number;
      bpm: string;
      textage: string;
    }[]
  > {
    return await db
      .selectFrom("allSongs")
      .select([
        "songId",
        "title",
        "notes",
        "difficulty",
        "difficultyLevel",
        "bpm",
        "textage",
      ])
      .execute();
  }
}

export const allSongsRepo = new AllSongsRepository();
