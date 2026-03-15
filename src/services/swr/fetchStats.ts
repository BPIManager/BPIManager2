import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR, { SWRConfiguration } from "swr";

interface StatsParams {
  userId: string | undefined;
  version: string;
  levels: string[];
  difficulties: string[];
}

function buildStatsUrl(
  userId: string,
  endpoint: string,
  version: string,
  levels: string[],
  difficulties: string[],
): string {
  const params = new URLSearchParams({ version });
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));
  return `${API_PREFIX}/users/${userId}/stats/${endpoint}?${params.toString()}`;
}

interface UseStatsDataOptions extends SWRConfiguration {
  requireLevels?: boolean;
}

export function useStatsData<T>(
  endpoint: string,
  { userId, version, levels, difficulties }: StatsParams,
  { requireLevels = true, ...swrOptions }: UseStatsDataOptions = {},
) {
  const { fbUser } = useUser();
  const hasLevels = levels.length > 0 || difficulties.length > 0;
  const shouldFetch = userId && version && (requireLevels ? hasLevels : true);

  const key = shouldFetch
    ? [buildStatsUrl(userId, endpoint, version, levels, difficulties), fbUser]
    : null;

  return useSWR<T>(key, fetcher, swrOptions);
}
