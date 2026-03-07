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
}

export interface BatchDetailItem {
  songId: number;
  title: string;
  notes: number;
  difficulty: string;
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
  };
}

export const useBatchDetails = (
  userId: string | undefined,
  version: string | undefined,
  batchId: string | undefined,
) => {
  const { data, error, isLoading } = useSWR<BatchDetailResponse>(
    userId && batchId ? `/api/${userId}/logs/${version}/${batchId}` : null,
    fetcher,
  );

  const summary = data
    ? {
        avgBpiDiff:
          data.songs.length > 0
            ? data.songs.reduce((acc, item) => acc + item.diff.bpi, 0) /
              data.songs.length
            : 0,
        newRecords: data.songs.filter((item) => !item.previous).length,
        updatedScores: data.songs.filter((item) => item.previous).length,
      }
    : null;

  return {
    details: data || null,
    summary,
    isLoading,
    isError: error,
  };
};
