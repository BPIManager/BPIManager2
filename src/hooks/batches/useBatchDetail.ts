import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { BpiCalculator } from "@/lib/bpi";
import { OvertakenRivalInfo } from "@/types/logs/overtaken";
import { fetcher } from "@/utils/common/fetch";
import { useMemo } from "react";
import useSWR from "swr";

export interface RankData {
  label: string;
  value: number;
}

export interface DJRankInfo {
  current: RankData;
  next: RankData;
}

export interface BatchRef {
  batchId: string;
  createdAt: string;
  totalBpi?: number;
}

export interface BatchDetailItem {
  songId: number;
  title: string;
  notes: number;
  difficulty: string;
  difficultyLevel: number;
  level: number;
  current: {
    exScore: number;
    bpi: number;
    clearState: string | null;
    missCount: number | null;
    lastPlayedAt: string;
    djRank: DJRankInfo;
  };
  previous: {
    exScore: number;
    bpi: number;
    clearState: string | null;
    missCount: number | null;
    djRank: DJRankInfo | null;
  } | null;
  diff: {
    exScore: number;
    bpi: number;
    isRankUp?: boolean;
  };
  overtaken: OvertakenRivalInfo[];
}

export interface BatchDetailResponse {
  songs: BatchDetailItem[];
  pagination: {
    prev: BatchRef | null;
    next: BatchRef | null;
    current: BatchRef;
    dailyBatchIds: string[];
    dailyBatchCount: number;
  };
}

export interface LogsDetailResponse extends BatchDetailResponse {
  pagination: BatchDetailResponse["pagination"] & {
    prevDate: string | null;
    nextDate: string | null;
  };
}

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
