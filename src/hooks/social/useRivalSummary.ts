import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { RadarSummaryData } from "@/types/stats/radar";
import { API_PREFIX } from "@/constants/apiEndpoints";

export interface RivalStats {
  win: number;
  lose: number;
  draw: number;
  totalCount: number;
}

export interface RivalSummaryResult {
  userId: string;
  userName: string;
  profileImage: string | null;
  iidxId: string | null;
  arenaRank: string | null;
  totalBpi: number | null;
  radar: RadarSummaryData;
  viewerRadar: RadarSummaryData;
  stats: RivalStats;
}

export const useRivalSummary = (params: {
  userId?: string | boolean;
  levels: string[];
  difficulties: string[];
  version: string;
}) => {
  const { userId, levels, difficulties, version } = params;
  const { fbUser } = useUser();
  const query = new URLSearchParams({ version });
  levels.forEach((l) => query.append("levels", l));
  difficulties.forEach((d) => query.append("difficulties", d));

  const url = userId
    ? `${API_PREFIX}/users/${userId}/rivals/following/summary?${query.toString()}`
    : null;

  const {
    data,
    error,
    isLoading: swrLoading,
    mutate,
  } = useSWR<RivalSummaryResult[]>(url ? [url, fbUser] : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const isLoading =
    swrLoading || (userId !== false && !data && !error) || userId === false;
  return {
    results: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};
