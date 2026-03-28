import { useStatsData } from "@/services/swr/fetchStats";

/**
 * ユーザーのスコア更新アクティビティ（日別件数）を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param levels - フィルタリングするレベル配列
 * @param difficulties - フィルタリングする難易度配列
 * @param version - IIDX バージョン文字列
 * @returns 日付・件数の配列・ローディング状態
 */
export const useActivity = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, isLoading } = useStatsData<{ date: string; count: number }[]>(
    "activity",
    { userId, version, levels, difficulties },
  );

  return { activity: data, isLoading };
};
