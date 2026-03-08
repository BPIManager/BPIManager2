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

  const { data, size, setSize, isValidating } = useSWRInfinite((index) => {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      offset: (index * PAGE_SIZE).toString(),
    });
    levels.forEach((l) => params.append("level", l));
    diffs.forEach((d) => params.append("difficulty", d));

    return `/api/${userId}/stats/${version}/recommended?${params.toString()}`;
  }, fetcher);

  const items = data ? data.flatMap((page) => page[type].data) : [];
  const total = data?.[0]?.[type]?.total || 0;
  const isReachingEnd = items.length >= total;

  return { items, size, setSize, isReachingEnd, isLoadingMore: isValidating };
};
