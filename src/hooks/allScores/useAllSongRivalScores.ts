import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

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
  const url =
    fbUser && songId
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/all-scores/${songId}/rivals?version=${version || latestVersion}`
      : null;
  const { data, error, isLoading, mutate, isValidating } = useAuthedSWRV2(url);

  return { data, isLoading, error, mutate, isValidating };
};
