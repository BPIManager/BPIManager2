import useSWR from "swr";
import type { OfficialArenaResponse } from "@/types/siteStats";
import { officialArenaFetcher } from "@/services/swr/officialArena";

export function useOfficialArena() {
  const { data, error, isLoading } = useSWR<OfficialArenaResponse>(
    "/api/v1/site/arena/official",
    officialArenaFetcher,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, isError: !!error };
}
