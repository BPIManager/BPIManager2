import { useStatsData } from "@/services/swr/fetchStats";
import type { BpmBandBpiItem } from "@/types/stats/distribution";

/**
 * BPM帯別総合BPIデータを取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param levels - フィルタリングするレベル配列
 * @param difficulties - フィルタリングする難易度配列
 * @param version - IIDX バージョン文字列
 * @returns BPM帯別総合BPI配列・ローディング状態・エラー情報
 */
export const useBpmBpiDistribution = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, error, isLoading } = useStatsData<BpmBandBpiItem[]>(
    "bpmBpiDistribution",
    { userId, version, levels, difficulties },
    { requireLevels: false },
  );

  return { distribution: data, isLoading, isError: error };
};
