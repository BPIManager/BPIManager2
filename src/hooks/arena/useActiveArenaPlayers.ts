import useSWR from "swr";
import type { ActiveArenaData } from "@/types/arena/activeArena";
import { activeArenaPlayersFetcher } from "@/services/swr/arena/activeArenaPlayers";

export function useActiveArenaPlayers(version: string, isLive: boolean) {
  return useSWR<ActiveArenaData>(
    isLive && version ? `/data/info/arena_official/${version}/active.json` : null,
    activeArenaPlayersFetcher,
    { revalidateOnFocus: false, refreshInterval: 5 * 60 * 1000 },
  );
}
