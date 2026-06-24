import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
import type { SiteStatsResponse } from "@/types/siteStats";

export function useSiteStats() {
  const { data, isLoading, error } = useSWR<SiteStatsResponse>(
    `${API_PREFIX}/site/stats`,
    fetcher,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, error };
}
