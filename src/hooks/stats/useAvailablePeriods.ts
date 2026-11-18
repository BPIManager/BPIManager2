import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { AvailablePeriodsData } from "@/types/stats/availablePeriods";

export const useAvailablePeriods = (
  userId: string | undefined,
  version: string | undefined,
) => {
  const url =
    userId && version
      ? `${API_V2_PREFIX}/users/${userId}/stats/available-periods?version=${version}`
      : null;

  const { data, isLoading } = useAuthedSWRV2<AvailablePeriodsData>(url, {
    revalidateOnFocus: false,
  });

  return { months: data?.months ?? [], isLoading };
};
