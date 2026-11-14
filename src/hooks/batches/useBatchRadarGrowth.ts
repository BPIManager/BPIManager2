import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { RadarGrowthSnapshot } from "@/types/logs/radarGrowth";

type PeriodType = "batch" | "day" | "week" | "month";

/**
 * 更新ログ（バッチ/日/週/月）単位のレーダー BEFORE/AFTER を取得する。
 *
 * @param userId - 対象ユーザー ID
 * @param version - IIDX バージョン
 * @param key - バッチ ID（type=batch）または日付（それ以外）
 * @param type - 期間種別
 * @param groupedBy - 日別以降の集計基準
 */
export const useBatchRadarGrowth = (
  userId: string | undefined,
  version: string | undefined,
  key: string | undefined,
  type: PeriodType,
  groupedBy: string,
) => {
  const url =
    userId && version && key
      ? `${API_V2_PREFIX}/users/${userId}/batches/${key}/radar-growth?version=${version}&type=${type}&groupedBy=${groupedBy}`
      : null;
  const { data, error, isLoading } = useAuthedSWRV2<RadarGrowthSnapshot>(url, {
    revalidateOnFocus: false,
  });
  return { data, isLoading, isError: error };
};
