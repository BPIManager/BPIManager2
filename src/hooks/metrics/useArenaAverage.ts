import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

/**
 * 指定バージョン・レベルのアリーナ平均スコア JSON を取得する。
 *
 * @param version - IIDX バージョン文字列
 * @param level - 難易度レベル（例: `12`）
 * @returns 平均スコアデータ配列・ローディング状態
 */
/** 未取得中に毎回新しい配列参照を返さない（依存配列の無効化を避ける）ための定数 */
const EMPTY_AVERAGES: never[] = [];

export const useArenaAverages = (version: string, level: number) => {
  const { data, isLoading } = useSWR(
    version && level ? `/data/metrics/arena/${version}_${level}.json` : null,
    fetcher,
  );

  return { averages: data || EMPTY_AVERAGES, isLoading };
};
