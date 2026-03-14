import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export const useActivity = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const params = new URLSearchParams();
  params.append("version", version);
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));

  const shouldFetch = userId && (levels.length > 0 || difficulties.length > 0);
  const { fbUser } = useUser();

  const { data, isLoading } = useSWR(
    shouldFetch
      ? [`/api/${userId}/stats/activity?${params.toString()}`, fbUser]
      : null,
    fetcher,
  );

  return { activity: data, isLoading };
};
