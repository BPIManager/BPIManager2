import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
import type { BatchDetailItem } from "@/types/logs/batchDetail";

export interface VersionSummaryResponse {
  songs: BatchDetailItem[];
  currentVersion: string;
  compareVersion: string | null;
  compareVersionLabel: string | null;
}

export const useVersionSummary = (
  userId: string | undefined,
  version: string | undefined,
) => {
  const { fbUser } = useUser();

  const { data, error, isLoading } = useSWR<VersionSummaryResponse>(
    userId && version
      ? [
          `${API_PREFIX}/users/${userId}/batches/version-summary?version=${version}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    data: data ?? null,
    isLoading,
    isError: error,
  };
};
