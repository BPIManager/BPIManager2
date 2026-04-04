import { API_PREFIX } from "@/constants/apiEndpoints";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

type RivalAvgRow = { songId: number; avgExScore: number | null };
type RivalTopRow = { songId: number; topExScore: number | null };

/**
 * 指定楽曲のライバル平均・ライバルTOPスコアを取得する。
 * 全楽曲分のデータをSWRキャッシュし、songIdでフィルタする。
 */
export const useRivalScoresForSong = (songId: number | null) => {
  const { user, fbUser } = useUser();
  const userId = user?.userId;

  const avgKey =
    userId && songId != null
      ? [
          `${API_PREFIX}/users/${userId}/rivals/following/avg-scores?version=${latestVersion}`,
          fbUser,
        ]
      : null;

  const topKey =
    userId && songId != null
      ? [
          `${API_PREFIX}/users/${userId}/rivals/following/top-scores?version=${latestVersion}`,
          fbUser,
        ]
      : null;

  const { data: avgData, isLoading: avgLoading } = useSWR<RivalAvgRow[]>(
    avgKey,
    fetcher,
  );
  const { data: topData, isLoading: topLoading } = useSWR<RivalTopRow[]>(
    topKey,
    fetcher,
  );

  const rawAvg = avgData?.find((r) => r.songId === songId)?.avgExScore ?? null;
  const rawTop = topData?.find((r) => r.songId === songId)?.topExScore ?? null;

  return {
    rivalAvgScore: rawAvg != null ? Math.round(rawAvg) : null,
    rivalTopScore: rawTop,
    isLoading: avgLoading || topLoading,
  };
};
