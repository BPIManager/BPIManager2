import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { latestVersion } from "@/constants/latestVersion";
import { SongWithRival } from "@/types/songs/withScore";
import { API_PREFIX } from "@/constants/apiEndpoints";

export const useRivalBothScores = (
  myUserId: string | undefined,
  rivalUserId: string | undefined,
  version?: string,
) => {
  const { fbUser } = useUser();
  const targetVersion = version || latestVersion;

  const { data, error, isLoading, mutate } = useSWR<SongWithRival[]>(
    myUserId && rivalUserId && fbUser
      ? [
          `${API_PREFIX}/users/${myUserId}/rivals/${rivalUserId}/scores?version=${targetVersion}`,
          fbUser,
        ]
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
