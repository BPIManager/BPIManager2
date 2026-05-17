import useSWR from "swr";
import type { OfficialArenaResponse } from "@/types/siteStats";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOfficialArena() {
  const { data, error, isLoading } = useSWR<OfficialArenaResponse>(
    "/api/v1/site/arena/official",
    fetcher,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, isError: !!error };
}
