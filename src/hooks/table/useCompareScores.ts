import useSWR from "swr";
import { SongWithScore } from "@/types/songs/withScore";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";

export const useCompareScores = (
  userId: string | undefined,
  currentVersion: string | undefined,
  compareVersion: string | undefined,
) => {
  const { fbUser } = useUser();

  const shouldFetch =
    !!userId &&
    !!currentVersion &&
    !!compareVersion &&
    compareVersion !== "none" &&
    compareVersion !== currentVersion;

  const { data, error, isLoading } = useSWR<SongWithScore[]>(
    shouldFetch
      ? [
          `${API_PREFIX}/users/${userId}/scores/self-version?currentVersion=${currentVersion}&targetVersion=${compareVersion}`,
          fbUser,
        ]
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    compareData: data,
    compareError: error,
    isCompareLoading: isLoading,
  };
};
