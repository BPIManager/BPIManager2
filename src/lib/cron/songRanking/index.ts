import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { songRankingCacheRepo } from "@/lib/db/domains/songRankingCache";

/**
 * 全バージョンの楽曲別ランキングキャッシュ（songRankingCache）を最新スコアで更新する。
 * バージョンごとに全ユーザー分の順位・総プレイヤー数を1クエリで算出し、そのバージョンの行を入れ替える。
 * スコアが無くなったバージョンも、古い行を残さないよう入れ替え（全削除）を行う。
 */
export async function updateAllSongRankingCache() {
  for (const version of IIDX_VERSIONS) {
    const rows = await songRankingCacheRepo.calculateForVersion(version);

    console.log(
      `[SongRanking] version ${version}: replacing with ${rows.length} rows...`,
    );
    await songRankingCacheRepo.replaceForVersion(version, rows);
  }

  console.log("[SongRanking] Cache update done for all versions");
}
