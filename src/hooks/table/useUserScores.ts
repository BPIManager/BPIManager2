import useSWR from "swr";
import { SongWithScore } from "@/types/songs/withScore";
import { latestVersion } from "@/constants/latestVersion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useUserScores = (userId: string, version?: string) => {
  const targetVersion = version || latestVersion;

  const { data, error, isLoading, mutate } = useSWR<SongWithScore[]>(
    userId ? `/api/${userId}/scores/${targetVersion}/latest` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  return {
    songs: data,
    error,
    isLoading,
    refresh: mutate,
    currentVersion: targetVersion,
  };
};
