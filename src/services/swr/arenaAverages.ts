import type { ArenaAverages } from "@/hooks/metrics/useArenaAveragesForSong";

export const arenaAveragesFetcher = async (
  url: string,
): Promise<ArenaAverages | null> => {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch arena averages");
  return res.json();
};
