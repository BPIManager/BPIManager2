import useSWR from "swr";
import type { ArenaEventEntry, ArenaVersionMetadata } from "@/lib/cron/arena/types";
import { arenaJsonFetcher } from "@/services/swr/arenaHistory";

export type ArenaHistoryRecord = {
  fetchedAt: string;
  arenaClass: string;
  arenaRank: number | null;
  wins: number | null;
  a1continue: string | null;
  classRank: number | null;   // = arenaRank（eagateクラス内順位）
  globalRank: number | null;  // = arenaRank + 上位クラス累積人数
};

export function useArenaMetadata(version: string) {
  return useSWR<ArenaVersionMetadata>(
    version ? `/data/metrics/arena_official/metadata/${version}.json` : null,
    arenaJsonFetcher,
    { revalidateOnFocus: false },
  );
}

export function useOfficialArenaHistory(
  userId: string,
  version: string,
  event: ArenaEventEntry | null,
) {
  const url =
    userId && event
      ? `/api/v1/users/${userId}/stats/arenaHistory?version=${version}&start=${encodeURIComponent(event.start)}&end=${encodeURIComponent(event.end)}`
      : null;
  return useSWR<ArenaHistoryRecord[]>(url, arenaJsonFetcher, { revalidateOnFocus: false });
}
