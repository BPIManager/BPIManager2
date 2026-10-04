import { useUser } from "@/contexts/users/UserContext";
import { fetcherV2 } from "@/services/swr/fetchV2";
import { useMemo } from "react";
import useSWRInfinite, { SWRInfiniteConfiguration } from "swr/infinite";

interface UseInfiniteListOptions<
  TPage,
  TItem,
> extends SWRInfiniteConfiguration {
  getItems: (page: TPage) => TItem[];
  isLastPage: (page: TPage) => boolean;
}

type GetPageUrl<TPage> = (
  pageIndex: number,
  previousPageData: TPage | null,
) => string | null;

/**
 * useInfiniteList の API v2 版。各ページを fetcherV2 で取得し、共通エンベロープの body（TPage）を各ページデータとして扱う。
 */
export function useInfiniteListV2<TPage, TItem>(
  getUrl: GetPageUrl<TPage>,
  { getItems, isLastPage, ...swrOptions }: UseInfiniteListOptions<TPage, TItem>,
) {
  const { fbUser } = useUser();

  const { data, size, setSize, isLoading, isValidating, error, mutate } =
    useSWRInfinite<TPage>(
      (pageIndex, previousPageData: TPage | null) => {
        const url = getUrl(pageIndex, previousPageData);
        return url ? ([url, fbUser?.uid ?? null] as const) : null;
      },
      ([url]) => fetcherV2<TPage>([url, fbUser ?? null]),
      swrOptions,
    );

  const items = useMemo(
    () => (data ? data.flatMap(getItems) : []),
    [data, getItems],
  );
  const isLoadingMore = isLoading || (isValidating && size > 1);
  const isReachingEnd = !!data && isLastPage(data[data.length - 1]);

  return {
    items,
    data,
    size,
    setSize,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError: error,
    mutate,
  };
}
