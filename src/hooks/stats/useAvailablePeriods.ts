import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
import type { AvailablePeriodsData } from "@/pages/api/v1/users/[userId]/stats/available-periods";

export const useAvailablePeriods = (
  userId: string | undefined,
  version: string | undefined,
) => {
  const { fbUser } = useUser();

  const url =
    userId && version
      ? `${API_PREFIX}/users/${userId}/stats/available-periods?version=${version}`
      : null;

  const { data, isLoading } = useSWR<AvailablePeriodsData>(
    url ? [url, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { months: data?.months ?? [], isLoading };
};
