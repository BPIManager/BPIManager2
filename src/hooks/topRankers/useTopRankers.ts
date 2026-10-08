import type { SongWithScore } from "@/types/songs/score";
import type { TopRankersSummary } from "@/lib/subhandlers/topRankers";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

const swrOptions = { revalidateOnFocus: false, dedupingInterval: 2000 };

/** プレイヤーが各バージョン・エリアで1位を獲得している譜面数の集計を取得する */
export const useTopRankersSummary = (userId: string | undefined) => {
  const { data, error, isLoading } = useAuthedSWRV2<TopRankersSummary>(
    userId ? `${API_V2_PREFIX}/users/${userId}/top-rankers/summary` : null,
    swrOptions,
  );
  return { summary: data, error, isLoading };
};

/** 指定バージョンで1位を獲得している譜面の一覧（BPI算出対象はBPI付き）を取得する */
export const useTopRankers = (userId: string | undefined, version: string) => {
  const { data, error, isLoading } = useAuthedSWRV2<SongWithScore[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/top-rankers?version=${version}`
      : null,
    swrOptions,
  );
  return { songs: data, error, isLoading };
};
