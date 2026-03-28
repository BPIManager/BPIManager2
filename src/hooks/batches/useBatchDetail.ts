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
