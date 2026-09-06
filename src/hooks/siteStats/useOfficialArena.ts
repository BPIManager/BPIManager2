import useSWR from "swr";
import type { OfficialArenaResponse } from "@/types/siteStats";
import { fetcherV2 } from "@/services/swr/fetchV2";

export function useOfficialArena() {
  const { data, error, isLoading } = useSWR<OfficialArenaResponse>(
    "/api/v2/site/arena/official",
    fetcherV2,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, isError: !!error };
}
