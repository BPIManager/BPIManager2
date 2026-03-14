import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWRInfinite from "swr/infinite";

export const useRecommendedInfinite = (
  userId: string,
  version: string,
  levels: string[],
  diffs: string[],
  type: "weapons" | "potential",
) => {
  const PAGE_SIZE = 20;
  const { fbUser } = useUser();

  const { data, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite(
      (index) => {
        if (!fbUser || !userId) return null;

        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: (index * PAGE_SIZE).toString(),
          version: version,
        });
        levels.forEach((l) => params.append("level", l));
        diffs.forEach((d) => params.append("difficulty", d));

        const url = `${API_PREFIX}/users/${userId}/stats//recommended?${params.toString()}`;

        return [url, fbUser];
      },
      fetcher,
      {
        revalidateOnFocus: false,
      },
    );

  const items = data ? data.flatMap((page) => page[type]?.data || []) : [];
  const total = data?.[0]?.[type]?.total || 0;
  const isReachingEnd = items.length >= total;

  return {
    items,
    size,
    setSize,
    isReachingEnd,
    isLoading: isLoading,
    isLoadingMore: isLoading || (isValidating && size > 1),
    isError: error,
  };
};
