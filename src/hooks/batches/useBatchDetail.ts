import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { BpiCalculator } from "@/lib/bpi";
import {
  BatchRef,
  BatchDetailItem,
  BatchDetailResponse,
  LogsDetailResponse,
} from "@/types/logs/batchDetail";
import { fetcher } from "@/utils/common/fetch";
import { useMemo } from "react";
import useSWR from "swr";

export type {
  BatchRef,
  BatchDetailItem,
  BatchDetailResponse,
  LogsDetailResponse,
};

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
  }: { batchId?: string; date?: string; groupedBy?: string },
) => {
  const groupParam = groupedBy ? `&groupedBy=${groupedBy}` : "";

  const endpoint = batchId
    ? `${API_PREFIX}/users/${userId}/batches/${batchId}?version=${version}${groupParam}`
    : date
      ? `${API_PREFIX}/users/${userId}/batches/${date}/scores?version=${version}${groupParam}`
      : null;

  const { fbUser } = useUser();

  const { data, error, isLoading, mutate } = useSWR<LogsDetailResponse>(
    endpoint ? [endpoint, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const summary = data
    ? {
        batchPerformance: (() => {
          const lv12Bpis = data.songs
            .filter((s) => s.difficultyLevel === 12)
            .map((s) => s.current?.bpi)
            .filter((b): b is number => typeof b === "number");

          return lv12Bpis.length > 0
            ? BpiCalculator.calculateTotalBPI(lv12Bpis, lv12Bpis.length)
            : -15;
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
