import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { BpiCalculator } from "@/lib/bpi";
import {
  LogsDetailResponse,
} from "@/types/logs/batchDetail";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useMemo } from "react";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

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
          const lv12Songs = data.songs.filter(
            (s) => s.difficultyLevel === 12 && s.current?.exScore != null,
          );
          if (lv12Songs.length === 0) return -15;

          const observations: IBpiScoreObservation[] = lv12Songs.map((s) => ({
            songId: s.songId,
            notes: s.notes,
            exScore: s.current!.exScore,
          }));
          const master: (IBpiBasicSongData & { songId: number })[] = lv12Songs.map(
            (s) => ({
              songId: s.songId,
              notes: s.notes,
              kaidenAvg: s.kaidenAvg ?? null,
              wrScore: s.wrScore ?? null,
              coef: s.coef,
              mu: s.mu,
              sigma: s.sigma,
              residualVar: s.residualVar,
            }),
          );
          return BpiCalculator.calculateTotalBPI(observations, master);
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
