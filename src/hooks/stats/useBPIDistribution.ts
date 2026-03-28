import { useStatsData } from "@/services/swr/fetchStats";

import type { RankDistItem } from "@/types/stats/distribution";

/**
 * 単曲 BPI の分布データを取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param levels - フィルタリングするレベル配列
 * @param difficulties - フィルタリングする難易度配列
 * @param version - IIDX バージョン文字列
 * @returns BPI 分布配列・ローディング状態・エラー情報
 */
export const useBPIDistribution = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, error, isLoading } = useStatsData<RankDistItem[]>(
    "singleBPIDistribution",
    { userId, version, levels, difficulties },
  );

  return { distribution: data, isLoading, isError: error };
};
