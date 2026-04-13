import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { SongRankingResponse } from "@/types/users/ranking";

/**
 * 指定 allSongs 楽曲のグローバルランキングを取得する（allScores テーブル使用）。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 */
export const useAllSongRanking = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useSWR<SongRankingResponse>(
    fbUser && songId
      ? `${API_PREFIX}/users/${fbUser.uid}/all-scores/${songId}/ranking?version=${version || latestVersion}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
