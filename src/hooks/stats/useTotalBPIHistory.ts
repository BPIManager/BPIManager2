import { useStatsData } from "@/services/swr/fetchStats";

import type { BpiHistoryItem } from "@/types/stats/bpiHistory";

/**
 * 合計 BPI の推移履歴を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param levels - フィルタリングするレベル配列
 * @param difficulties - フィルタリングする難易度配列
 * @param version - IIDX バージョン文字列
 * @returns 合計 BPI 履歴配列・ローディング状態・エラー情報
 */
export const useTotalBpiHistory = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, error, isLoading } = useStatsData<BpiHistoryItem[]>(
    "totalBPIhistory",
    { userId, version, levels, difficulties },
  );

  return { history: data, isLoading, isError: error };
};
