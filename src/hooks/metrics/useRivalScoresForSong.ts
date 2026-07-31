import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";

type RivalAvgRow = { songId: number; avgExScore: number | null };
type RivalTopRow = { songId: number; topExScore: number | null };

/**
 * 指定楽曲のライバル平均・ライバルTOPスコアを取得する。
 * enabled=false の場合はフェッチしない。
 * songId をクエリパラメータで渡すことで当該楽曲のみ取得する。
 */
export const useRivalScoresForSong = (
  songId: number | null,
  enabled = false,
) => {
  const { user } = useUser();
  const userId = user?.userId;

  const shouldFetch = enabled && userId != null && songId != null;

  const avgUrl = shouldFetch
    ? `${API_PREFIX}/users/${userId}/rivals/following/avg-scores?version=${latestVersion}&songIds=${songId}`
    : null;

  const topUrl = shouldFetch
    ? `${API_PREFIX}/users/${userId}/rivals/following/top-scores?version=${latestVersion}&songIds=${songId}`
    : null;

  const { data: avgData, isLoading: avgLoading } =
    useAuthedSWR<RivalAvgRow[]>(avgUrl);
  const { data: topData, isLoading: topLoading } =
    useAuthedSWR<RivalTopRow[]>(topUrl);

  const rawAvg = avgData?.find((r) => r.songId === songId)?.avgExScore ?? null;
  const rawTop = topData?.find((r) => r.songId === songId)?.topExScore ?? null;

  return {
    rivalAvgScore: rawAvg != null ? Math.round(rawAvg) : null,
    rivalTopScore: rawTop,
    isLoading: avgLoading || topLoading,
  };
};
