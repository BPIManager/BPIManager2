import useSWR from "swr";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import type { ArenaAverageRow, RivalAvgRow, RivalTopRow } from "./comparisonRows";

/**
 * `useAnalyticsComparison`が比較ターゲット種別ごとに使い分けるデータソース取得フック群。
 */

export const useRivalAvgScores = (
  userId: string | undefined,
  version: string,
) => {
  const { data, error, isLoading } = useAuthedSWR<RivalAvgRow[]>(
    userId
      ? `${API_PREFIX}/users/${userId}/rivals/following/avg-scores?version=${version}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

export const useRivalTopScores = (
  userId: string | undefined,
  version: string,
) => {
  const { data, error, isLoading } = useAuthedSWR<RivalTopRow[]>(
    userId
      ? `${API_PREFIX}/users/${userId}/rivals/following/top-scores?version=${version}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

export const useArenaJson = (version: string, levels: number[]) => {
  const v = "32";
  const { data: data11, isLoading: l11 } = useSWR<ArenaAverageRow[]>(
    levels.includes(11) ? `/data/metrics/arena/${v}_11.json` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const { data: data12, isLoading: l12 } = useSWR<ArenaAverageRow[]>(
    levels.includes(12) ? `/data/metrics/arena/${v}_12.json` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    rows: [...(data11 ?? []), ...(data12 ?? [])],
    isLoading: l11 || l12,
  };
};
