import { sql } from "kysely";
import { db } from "@/lib/db";

export interface UnmatchedImportSong {
  title: string;
  difficulty: string;
}

/**
 * `unmatchedImportSongs` テーブル（インポートCSVに含まれていたが `allSongs` に無かった曲）の記録・参照。
 * 新曲登録時に、ユーザーのCSV上の正しい曲名表記を集めるために使う。
 */
class UnmatchedImportSongsRepository {
  /**
   * 該当曲が無かった行を記録する。既存の (title, difficulty) は hitCount を加算する。
   * 同一キーはまとめて1回分とし、重複除去後の先頭 limit 件をデッドロック回避のためキー順に挿入する。
   *
   * @param songs - 該当曲が無かったタイトルと難易度
   * @param limit - 1回で記録する件数の上限（重複除去後）
   */
  async recordMany(songs: UnmatchedImportSong[], limit: number) {
    const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    const unique = [
      ...new Map(songs.map((s) => [`${s.title}\u0000${s.difficulty}`, s])).values(),
    ]
      .slice(0, limit)
      .sort(
        (a, b) =>
          compare(a.title, b.title) || compare(a.difficulty, b.difficulty),
      );
    if (unique.length === 0) return;

    await db
      .insertInto("unmatchedImportSongs")
      .values(unique.map(({ title, difficulty }) => ({ title, difficulty })))
      .onDuplicateKeyUpdate({ hitCount: sql`hitCount + 1` })
      .execute();
  }

  /**
   * 記録を回数の多い順に取得する。
   *
   * @param limit - 取得件数の上限
   */
  async listByHitCount(limit: number) {
    return await db
      .selectFrom("unmatchedImportSongs")
      .selectAll()
      .orderBy("hitCount", "desc")
      .orderBy("lastSeenAt", "desc")
      .limit(limit)
      .execute();
  }
}

export const unmatchedImportSongsRepo = new UnmatchedImportSongsRepository();
