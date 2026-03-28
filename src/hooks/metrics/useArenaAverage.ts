import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

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
