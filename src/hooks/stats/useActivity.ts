import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export const useActivity = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
) => {
  const params = new URLSearchParams();
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));

  const shouldFetch = userId && (levels.length > 0 || difficulties.length > 0);

  const { data, isLoading } = useSWR(
    shouldFetch ? `/api/${userId}/stats/activity?${params.toString()}` : null,
    fetcher,
  );

  return { activity: data, isLoading };
};
