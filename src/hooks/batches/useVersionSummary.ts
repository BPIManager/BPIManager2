import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
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
  const { data, error, isLoading } = useAuthedSWRV2<VersionSummaryResponse>(
    userId && version
      ? `${API_V2_PREFIX}/users/${userId}/batches/version-summary?version=${version}`
      : null,
    { revalidateOnFocus: false },
  );

  return {
    data: data ?? null,
    isLoading,
    isError: error,
  };
};
