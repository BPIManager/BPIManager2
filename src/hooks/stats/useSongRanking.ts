import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { SongRankingResponse } from "@/types/users/ranking";

export const useSongRanking = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useSWR<SongRankingResponse>(
    fbUser && songId
      ? `${API_PREFIX}/users/${fbUser.uid}/ranking/song/${songId}?version=${version || latestVersion}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
