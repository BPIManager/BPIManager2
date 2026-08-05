import useSWR from "swr";
import { activeArenaPlayersFetcher } from "@/services/swr/activeArenaPlayers";

export interface ActiveArenaData {
  generatedAt: string;
  prevFetchedAt: string | null;
  byClass: Record<string, number>;
}

export function useActiveArenaPlayers(version: string, isLive: boolean) {
  return useSWR<ActiveArenaData>(
    isLive && version ? `/data/info/arena_official/${version}/active.json` : null,
    activeArenaPlayersFetcher,
    { revalidateOnFocus: false, refreshInterval: 5 * 60 * 1000 },
  );
}
