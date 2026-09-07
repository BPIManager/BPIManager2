import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { SWRConfiguration } from "swr";

interface StatsParams {
  userId: string | undefined;
  version: string;
  levels: string[];
  difficulties: string[];
  step?: number;
  groupBy?: string;
}

function buildStatsUrl(
  userId: string,
  endpoint: string,
  version: string,
  levels: string[],
  difficulties: string[],
  step?: number,
  groupBy?: string,
): string {
  const params = new URLSearchParams({ version });
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));
  if (step !== undefined) params.set("step", String(step));
  if (groupBy !== undefined) params.set("groupBy", groupBy);
  return `${API_V2_PREFIX}/users/${userId}/stats/${endpoint}?${params.toString()}`;
}

interface UseStatsDataOptions extends SWRConfiguration {
  requireLevels?: boolean;
}

export function useStatsData<T>(
  endpoint: string,
  { userId, version, levels, difficulties, step, groupBy }: StatsParams,
  { requireLevels = true, ...swrOptions }: UseStatsDataOptions = {},
) {
  const hasLevels = levels.length > 0 || difficulties.length > 0;
  const shouldFetch = userId && version && (requireLevels ? hasLevels : true);

  const url = shouldFetch
    ? buildStatsUrl(userId, endpoint, version, levels, difficulties, step, groupBy)
    : null;

  return useAuthedSWRV2<T>(url, swrOptions);
}
