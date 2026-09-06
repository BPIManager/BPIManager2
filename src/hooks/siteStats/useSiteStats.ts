import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcherV2 } from "@/services/swr/fetchV2";
import useSWR from "swr";
import type { SiteStatsResponse } from "@/types/siteStats";

export function useSiteStats() {
  const { data, isLoading, error } = useSWR<SiteStatsResponse>(
    `${API_V2_PREFIX}/site/stats`,
    fetcherV2,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, error };
}
