import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
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
 * ページごとのURLだけを返す`getUrl`から無限スクロールリストを組み立てる。
 *
 * SWRのキャッシュキーにFirebase `User`オブジェクト全体を含めると無駄な
 * ハッシュ化コストがかかるため、キーには`fbUser?.uid`のみを使い、
 * `fbUser`自体はクロージャ経由でfetcherに渡す。
 */
export function useInfiniteList<TPage, TItem>(
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
      ([url]) => fetcher([url, fbUser ?? null]),
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
