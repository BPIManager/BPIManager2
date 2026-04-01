import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { GlobalRankingResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/latestVersion";

export const useGlobalRanking = (
  version: string = latestVersion,
  category = "totalBpi",
) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useSWR<GlobalRankingResponse>(
    fbUser
      ? [
          `${API_PREFIX}/users/${fbUser.uid}/ranking/global?version=${version}&category=${category}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, isError: error };
};
