import type { ArenaAverages } from "@/hooks/metrics/useArenaAveragesForSong";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export const arenaAveragesFetcher = async (
  url: string,
): Promise<ArenaAverages | null> => {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch arena averages");
  return unwrapApiResponse<ArenaAverages | null>(res);
};
