import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { songRankingCacheRepo } from "@/lib/db/domains/songRankingCache";

/**
 * 全バージョンの楽曲別ランキングキャッシュ（`songRankingCache` テーブル）を最新スコアで更新する。
 *
 * バージョンごとに全ユーザー分の順位・総プレイヤー数を1回のクエリでまとめて算出し、
 * bulk UPSERTで書き込む。スコアが存在しないバージョンはスキップする。
 */
export async function updateAllSongRankingCache() {
  for (const version of IIDX_VERSIONS) {
    const rows = await songRankingCacheRepo.calculateForVersion(version);

    if (rows.length === 0) {
      console.log(`[SongRanking] version ${version}: no scores, skipping`);
      continue;
    }

    console.log(
      `[SongRanking] version ${version}: writing ${rows.length} rows...`,
    );
    await songRankingCacheRepo.bulkUpsert(rows);
  }

  console.log("[SongRanking] Cache update done for all versions");
}
