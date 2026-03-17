import { fetcher } from "@/utils/common/fetch";
import useSWRInfinite, {
  SWRInfiniteKeyLoader,
  SWRInfiniteConfiguration,
} from "swr/infinite";

interface UseInfiniteListOptions<
  TPage,
  TItem,
> extends SWRInfiniteConfiguration {
  getItems: (page: TPage) => TItem[];
  isLastPage: (page: TPage) => boolean;
}

export function useInfiniteList<TPage, TItem>(
  getKey: SWRInfiniteKeyLoader<TPage>,
  { getItems, isLastPage, ...swrOptions }: UseInfiniteListOptions<TPage, TItem>,
) {
  const { data, size, setSize, isLoading, isValidating, error, mutate } =
    useSWRInfinite<TPage>(getKey, fetcher, swrOptions);

  const items = data ? data.flatMap(getItems) : [];
  const isLoadingMore = isLoading || (isValidating && size > 1);
  const isReachingEnd = !!data && isLastPage(data[data.length - 1]);

  return {
    items,
    size,
    setSize,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError: error,
    mutate,
  };
}
