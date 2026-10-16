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
   * 同一キーはまとめて1回分とし、デッドロック回避のためキー順に挿入する。
   *
   * @param songs - 該当曲が無かったタイトルと難易度
   */
  async recordMany(songs: UnmatchedImportSong[]) {
    const unique = [
      ...new Map(songs.map((s) => [`${s.title}\u0000${s.difficulty}`, s])).values(),
    ].sort(
      (a, b) =>
        a.title.localeCompare(b.title) ||
        a.difficulty.localeCompare(b.difficulty),
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
