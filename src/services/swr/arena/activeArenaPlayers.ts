import type { ActiveArenaData } from "@/hooks/arena/useActiveArenaPlayers";

export const activeArenaPlayersFetcher = async (
  url: string,
): Promise<ActiveArenaData> => {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<ActiveArenaData>;
};
