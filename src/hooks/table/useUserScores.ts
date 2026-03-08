import useSWR from "swr";
import { SongWithScore } from "@/types/songs/withScore";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";

export const useUserScores = (userId: string | undefined, version?: string) => {
  const targetVersion = version || latestVersion;
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate } = useSWR<SongWithScore[]>(
    userId ? [`/api/${userId}/scores/${targetVersion}/latest`, fbUser] : null,
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
