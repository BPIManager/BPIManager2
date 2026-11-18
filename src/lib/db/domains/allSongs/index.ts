import { db } from "@/lib/db";
import type { Transaction } from "kysely";
import type { Database } from "@/types/db";
import { INFINITAS_VERSION } from "@/constants/iidx/iidxVersions";

/**
 * `allSongs` テーブル（全難易度楽曲マスタ、`allScores` のFK親）の参照を担当するリポジトリクラス。
 *
 * `allSongs` を参照する処理は、他ドメインから直接クエリせず本リポジトリ経由で行う方針とする。
 */
class AllSongsRepository {
  /**
   * 全難易度の楽曲マスタを取得する。
   *
   * @param trx - 呼び出し元のトランザクション
   * @param version - 指定時、INFINITAS 以外のバージョンでは INF 限定曲を除外する
   * @returns 楽曲 ID・タイトル・ノーツ数・難易度・BPM・textage を含む配列
   */
  async getAllLevelMaster(
    trx?: Transaction<Database>,
    version?: string,
  ): Promise<
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
    return await (trx ?? db)
      .selectFrom("allSongs")
      .$if(version !== undefined && version !== INFINITAS_VERSION, (qb) =>
        qb.where("isInfinitasOnly", "=", 0),
      )
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
