import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
/** アリーナ平均スコアデータの1楽曲分 */
export interface ArenaAverageData {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  /** アリーナランク（`"A1"` など）をキーとした平均スコア情報 */
  averages: Record<
    string,
    {
      /** 平均EXスコア */
      avgExScore: number;
      /** スコアレート */
      rate: number;
      /** 集計件数 */
      count: number;
    }
  >;
}

/**
 * 指定バージョン・レベルのアリーナ平均スコア JSON を取得する。
 *
 * @param version - IIDX バージョン文字列
 * @param level - 難易度レベル（例: `12`）
 * @returns 平均スコアデータ配列・ローディング状態
 */
export const useArenaAverages = (version: string, level: number) => {
  const { data, error, isLoading } = useSWR(
    version && level ? `/data/metrics/arena/${version}_${level}.json` : null,
    fetcher,
  );

  return { averages: data || [], isLoading };
};
