import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useSongRankingQueryV2 } from "@/hooks/common/useSongRankingQueryV2";

/**
 * 指定 allSongs 楽曲のグローバルランキングを取得する（allScores テーブル使用）。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 */
export const useAllSongRanking = (
  songId: number | null,
  version: string | null,
) =>
  useSongRankingQueryV2(songId, version, (uid, songId, version) =>
    `${API_V2_PREFIX}/users/${uid}/all-scores/${songId}/ranking?version=${version}`,
  );
