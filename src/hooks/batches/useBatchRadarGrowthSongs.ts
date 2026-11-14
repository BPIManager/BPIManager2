import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { RadarCategory } from "@/types/stats/radar";
import type { RadarGrowthSongsResponse } from "@/types/logs/radarGrowth";

type PeriodType = "batch" | "day" | "week" | "month";

/**
 * 更新ログ（バッチ/日/週/月）の指定レーダーカテゴリについて、更新曲の前後スコアと総合BPIへのインパクトを取得する。
 *
 * @param category - 対象カテゴリ（null の間は取得しない）
 */
export const useBatchRadarGrowthSongs = (
  userId: string | undefined,
  version: string | undefined,
  key: string | undefined,
  type: PeriodType,
  groupedBy: string,
  category: RadarCategory | null,
) => {
  const url =
    userId && version && key && category
      ? `${API_V2_PREFIX}/users/${userId}/batches/${key}/radar-growth-songs?version=${version}&type=${type}&groupedBy=${groupedBy}&category=${category}`
      : null;
  const { data, error, isLoading } = useAuthedSWRV2<RadarGrowthSongsResponse>(url, {
    revalidateOnFocus: false,
  });
  return { data, isLoading, isError: error };
};
