import useSWR from "swr";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { fetcher } from "@/utils/common/fetch";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { arenaDataVersion } from "@/constants/iidx/iidxVersions";
import type { TopRankerAreaScoreRow } from "@/lib/subhandlers/topRankers";
import type { ArenaAverageRow, RivalAvgRow, RivalTopRow } from "./comparisonRows";

/**
 * `useAnalyticsComparison`が比較ターゲット種別ごとに使い分けるデータソース取得フック群。
 */

export const useRivalAvgScores = (
  userId: string | undefined,
  version: string,
) => {
  const { data, error, isLoading } = useAuthedSWRV2<RivalAvgRow[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/rivals/following/avg-scores?version=${version}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

export const useRivalTopScores = (
  userId: string | undefined,
  version: string,
) => {
  const { data, error, isLoading } = useAuthedSWRV2<RivalTopRow[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/rivals/following/top-scores?version=${version}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

export const useTopRankerAreaScores = (
  userId: string | undefined,
  version: string,
  areaId: number | undefined,
) => {
  const { data, error, isLoading } = useAuthedSWRV2<TopRankerAreaScoreRow[]>(
    userId && areaId !== undefined
      ? `${API_V2_PREFIX}/users/${userId}/top-rankers/area-scores?version=${version}&areaId=${areaId}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

export const useArenaJson = (levels: number[]) => {
  // 静的JSONは v2 エンベロープではなく素の配列のため v1 fetcher で取得する
  const { data: data11, error: e11, isLoading: l11 } = useSWR<ArenaAverageRow[]>(
    levels.includes(11) ? `/data/metrics/arena/${arenaDataVersion}_11.json` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const { data: data12, error: e12, isLoading: l12 } = useSWR<ArenaAverageRow[]>(
    levels.includes(12) ? `/data/metrics/arena/${arenaDataVersion}_12.json` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    rows: [...(data11 ?? []), ...(data12 ?? [])],
    isLoading: l11 || l12,
    error: (e11 ?? e12) as Error | undefined,
  };
};
