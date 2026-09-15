import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewTopSongs } from "@/types/stats/monthlyReview";

export const useMonthlyReviewTopSongs = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM, YYYY or "all"
  compareVersion?: string,
  excludeNewPlays?: boolean,
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/top-songs?version=${version}&month=${month}${compareVersion ? `&compareVersion=${compareVersion}` : ""}${excludeNewPlays ? "&excludeNewPlays=true" : ""}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewTopSongs>(url, {
    revalidateOnFocus: false,
    // config UIでの比較先バージョン変更時、再フェッチ中に前のデータを保持して
    // セクション全体が一瞬消えるのを防ぐ（isLoadingで個別にスケルトン表示する）
    keepPreviousData: true,
  });

  return { data, isLoading, error };
};
