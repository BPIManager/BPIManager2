import { useStatsData } from "@/services/swr/fetchStats";
import { RadarResponse } from "@/types/stats/radar";


/**
 * レーダーチャートデータ（スキルカテゴリ別スコア）を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param levels - フィルタリングするレベル配列
 * @param difficulties - フィルタリングする難易度配列
 * @param version - IIDX バージョン文字列
 * @returns レーダーデータ・ローディング状態・エラー・更新関数
 */
export const useRadar = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, error, isLoading, mutate } = useStatsData<RadarResponse>(
    "radar",
    { userId, version, levels, difficulties },
    {
      requireLevels: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return { radar: data, isLoading, isError: error, mutate };
};
