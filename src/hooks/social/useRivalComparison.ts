import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";

export const useRivalComparison = (rivalId: string | null) => {
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    fbUser && rivalId
      ? [`${API_PREFIX}/users/${rivalId}/profile?compare=true`, fbUser]
      : null,
    fetcher,
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    isValidating,
  };
};
