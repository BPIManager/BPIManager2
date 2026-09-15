import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewRadarGrowth } from "@/types/stats/monthlyReview";

export const useMonthlyReviewRadarGrowth = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM, YYYY or "all"
  compareVersion?: string,
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/radar-growth?version=${version}&month=${month}${compareVersion ? `&compareVersion=${compareVersion}` : ""}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewRadarGrowth>(url, {
    revalidateOnFocus: false,
    // config UIでの比較先バージョン変更時、再フェッチ中に前のデータを保持して
    // セクション全体が一瞬消えるのを防ぐ（isLoadingで個別にスケルトン表示する）
    keepPreviousData: true,
  });

  return { data, isLoading, error };
};
