import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import type { SongRankingResponse } from "@/types/users/ranking";

export const useSongRanking = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();

  const url =
    fbUser && songId
      ? `${API_PREFIX}/users/${fbUser.uid}/ranking/song/${songId}?version=${version || latestVersion}`
      : null;
  const { data, isLoading, error } = useSWR<SongRankingResponse>(
    url ? [url, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
