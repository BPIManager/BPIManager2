import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";

export const useRivalComparison = (rivalId: string | null) => {
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    fbUser && rivalId
      ? [
          `/api/${fbUser.uid}/rivals/compareWithProfile?rivalId=${rivalId}`,
          fbUser,
        ]
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
