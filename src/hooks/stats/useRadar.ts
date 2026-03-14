import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { RadarCategory, RadarCategoryResult } from "@/types/stats/radar";

export type RadarResponse = Record<RadarCategory, RadarCategoryResult>;

export const useRadar = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { fbUser } = useUser();

  const params = new URLSearchParams();
  params.append("version", version);
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));

  const shouldFetch = userId && version;

  const { data, error, isLoading, mutate } = useSWR<RadarResponse>(
    shouldFetch
      ? [`/api/${userId}/stats/radar?${params.toString()}`, fbUser]
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    radar: data,
    isLoading,
    isError: error,
    mutate,
  };
};
