import { BpiV1 } from "@bpim/bpicalc";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { BpiCalculator } from "@/lib/bpi";
import {
  LogsDetailResponse,
} from "@/types/logs/batchDetail";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useMemo } from "react";

// 今回更新したV2単曲BPIの集合を丸ごと1つの「対象楽曲」として扱う
// べき乗平均(総曲数=集合のサイズなので未プレイ曲の穴埋めは発生しない。
// bpiBoxStats.tsのtotalOfと同じ考え方)。少数の観測から潜在スキルを推定する
// シフト法(BpiCalculator.calculateTotalBPI)は使わない
// (縮小推定で実力より大幅に低く出るため)。
const v1Aggregator = new BpiV1();

/**
 * バッチ詳細または日付別スコア詳細を取得し、サマリーと抜いた楽曲を付加して返す。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン文字列
 * @param options.batchId - 特定バッチの ID（指定時はバッチ単位で取得）
 * @param options.date - 日付文字列（batchId 未指定かつ date 指定時は日付単位で取得）
 * @param options.groupedBy - グループ化単位
 * @returns 楽曲詳細・サマリー・抜いた楽曲一覧・ローディング状態
 */
export const useLogsDetail = (
  userId: string | undefined,
  version: string | undefined,
  {
    batchId,
    date,
    groupedBy,
    type,
  }: { batchId?: string; date?: string; groupedBy?: string; type?: "day" | "week" | "month" },
) => {
  const groupParam = groupedBy ? `&groupedBy=${groupedBy}` : "";
  const typeParam = type && type !== "day" ? `&type=${type}` : "";

  const endpoint = batchId
    ? `${API_V2_PREFIX}/users/${userId}/batches/${batchId}?version=${version}${groupParam}`
    : date
      ? `${API_V2_PREFIX}/users/${userId}/batches/${date}/scores?version=${version}${groupParam}${typeParam}`
      : null;

  const { data, error, isLoading, mutate } = useAuthedSWRV2<LogsDetailResponse>(
    endpoint,
    { revalidateOnFocus: false },
  );

  const summary = data
    ? {
        batchPerformance: (() => {
          const lv12Played = data.songs.filter(
            (s) => s.difficultyLevel === 12 && s.current?.exScore != null,
          );
          if (lv12Played.length === 0) return null;

          const bpisDesc = lv12Played
            .map((s) =>
              BpiCalculator.calc(s.current!.exScore, {
                notes: s.notes,
                kaidenAvg: s.kaidenAvg ?? null,
                wrScore: s.wrScore ?? null,
                coef: s.coef,
                mu: s.mu,
                sigma: s.sigma,
                residualVar: s.residualVar,
              }),
            )
            .filter((b): b is number => b !== null)
            .sort((a, b) => b - a);
          if (bpisDesc.length === 0) return null;

          return v1Aggregator.total(bpisDesc, bpisDesc.length);
        })(),
        newRecords: data.songs.filter((item) => !item.previous).length,
        updatedScores: data.songs.filter((item) => item.previous).length,
      }
    : null;

  const overtakenSongs = useMemo(() => {
    if (!data?.songs) return [];
    return data.songs.filter((s) => s.overtaken && s.overtaken.length > 0);
  }, [data]);

  return {
    details: data || null,
    overtakenSongs,
    summary,
    isLoading,
    isError: error,
    mutate,
  };
};
