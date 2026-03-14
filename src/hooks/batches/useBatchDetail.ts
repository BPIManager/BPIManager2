import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { BpiCalculator } from "@/lib/bpi";
import { fetcher } from "@/utils/common/fetch";
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
  { batchId, date }: { batchId?: string; date?: string },
) => {
  const endpoint = batchId
    ? `${API_PREFIX}/users/${userId}/batches/${batchId}?version=${version}`
    : date
      ? `${API_PREFIX}/users/${userId}/batches/${date}/scores?version=${version}`
      : null;
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate } = useSWR<LogsDetailResponse>(
    endpoint ? [endpoint, fbUser] : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
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

  return {
    details: data || null,
    summary,
    isLoading,
    isError: error,
    mutate,
  };
};
