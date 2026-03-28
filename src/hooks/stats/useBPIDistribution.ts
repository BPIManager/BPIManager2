import { useStatsData } from "@/services/swr/fetchStats";

/** ランク分布の1区間 */
export interface RankDistItem {
  /** 区間ラベル（例: `"0〜10"`, `"AAA"` など） */
  label: string;
  /** 該当楽曲数 */
  count: number;
}

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
