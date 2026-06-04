import useSWR from "swr";

export interface ActiveArenaData {
  generatedAt: string;
  prevFetchedAt: string | null;
  byClass: Record<string, number>;
}

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<ActiveArenaData>;
};

export function useActiveArenaPlayers(version: string, isLive: boolean) {
  return useSWR<ActiveArenaData>(
    isLive && version ? `/data/info/arena_official/${version}/active.json` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 5 * 60 * 1000 },
  );
}
