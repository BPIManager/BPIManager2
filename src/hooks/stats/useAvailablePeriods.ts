import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import type { AvailablePeriodsData } from "@/pages/api/v1/users/[userId]/stats/available-periods";

export const useAvailablePeriods = (
  userId: string | undefined,
  version: string | undefined,
) => {
  const url =
    userId && version
      ? `${API_PREFIX}/users/${userId}/stats/available-periods?version=${version}`
      : null;

  const { data, isLoading } = useAuthedSWR<AvailablePeriodsData>(url, {
    revalidateOnFocus: false,
  });

  return { months: data?.months ?? [], isLoading };
};
