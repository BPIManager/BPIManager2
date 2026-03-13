import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { latestVersion } from "@/constants/latestVersion";
import { SongWithScore } from "@/types/songs/withScore";

export interface SongWithRival extends SongWithScore {
  rival: {
    exScore: number | null;
    bpi: number | null;
    clearState: string | null;
    missCount: number | null;
  } | null;
}

export const useRivalBothScores = (
  myUserId: string | undefined,
  rivalUserId: string | undefined,
  version?: string,
) => {
  const targetVersion = version || latestVersion;
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate } = useSWR<SongWithRival[]>(
    myUserId && rivalUserId && fbUser
      ? [`/api/${myUserId}/rivals/${targetVersion}/${rivalUserId}`, fbUser]
      : null,
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
