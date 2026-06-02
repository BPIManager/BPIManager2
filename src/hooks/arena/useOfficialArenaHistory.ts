import useSWR from "swr";
import type { ArenaEventEntry, ArenaVersionMetadata } from "@/lib/cron/arena/types";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

export type ArenaHistoryRecord = {
  fetchedAt: string;
  arenaClass: string;
  arenaRank: number | null;
  wins: number | null;
};

export function useArenaMetadata(version: string) {
  return useSWR<ArenaVersionMetadata>(
    version ? `/data/metrics/arena_official/metadata/${version}.json` : null,
    fetcher,
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
  return useSWR<ArenaHistoryRecord[]>(url, fetcher, { revalidateOnFocus: false });
}
