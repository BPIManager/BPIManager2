import { useStatsData } from "@/hooks/stats/useStatsData";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { RankDistItem } from "@/types/stats/distribution";

/**
 * 自己歴代ベストを出したバージョンごとの譜面件数を取得する。結果は全バージョンが対象で、
 * 画面で選択中のバージョンに依存しないため、キーが変わって再取得されないよう固定値を渡す。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param levels - フィルタリングするレベル配列
 * @param difficulties - フィルタリングする難易度配列
 */
export const useVersionCountDistribution = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
) => {
  const { data, error, isLoading } = useStatsData<RankDistItem[]>(
    "versionCountDistribution",
    { userId, version: latestVersion, levels, difficulties },
  );

  return { distribution: data, isLoading, isError: error };
};
