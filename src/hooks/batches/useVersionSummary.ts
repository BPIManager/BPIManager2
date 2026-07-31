import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
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
  const { data, error, isLoading } = useAuthedSWR<VersionSummaryResponse>(
    userId && version
      ? `${API_PREFIX}/users/${userId}/batches/version-summary?version=${version}`
      : null,
    { revalidateOnFocus: false },
  );

  return {
    data: data ?? null,
    isLoading,
    isError: error,
  };
};
