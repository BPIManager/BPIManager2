import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { API_PREFIX } from "@/constants/apiEndpoints";

/**
 * 指定 allSongs 楽曲のフォロー中ライバル全員のスコアを取得する（allScores テーブル使用）。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 */
export const useAllSongRivalScores = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    fbUser && songId
      ? `${API_PREFIX}/users/${fbUser.uid}/all-scores/${songId}/rivals?version=${version || latestVersion}`
      : null,
    fetcher,
  );

  return { data, isLoading, error, mutate, isValidating };
};
