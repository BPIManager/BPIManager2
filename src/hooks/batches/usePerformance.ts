import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { PerformanceResponse } from "@/types/logs/performance";

/**
 * 指定日(JST)のプレイ記録の時系列・日別サマリー・過去プレイ日との比較データを取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン
 * @param date - 対象日 (YYYY-MM-DD)
 * @param enabled - false の間はフェッチしない(タブ非表示時など)
 */
export const usePerformance = (
  userId: string | undefined,
  version: string | undefined,
  date: string | undefined,
  enabled: boolean,
) => {
  const endpoint =
    enabled && userId && version && date
      ? `${API_V2_PREFIX}/users/${userId}/stats/performance?version=${version}&date=${date}`
      : null;

  const { data, error, isLoading, mutate } =
    useAuthedSWRV2<PerformanceResponse>(endpoint, { revalidateOnFocus: false });

  return { data: data ?? null, isLoading, isError: error, mutate };
};
