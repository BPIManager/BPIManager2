import { useUser } from "@/contexts/users/UserContext";
import { FilterParamsFrontend } from "@/types/songs/score";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

import type { TimelineEntry } from "@/types/social/timeline";

interface TimelineResponse {
  timeline: TimelineEntry[];
  nextId: string | null;
}

/**
 * フォロー中ライバルのアクティビティタイムラインを無限スクロールで取得する。
 *
 * @param mode - 表示モード。`"all"` 全件、`"played"` 閲覧者もプレイ済み、`"overtaken"` 抜かれた楽曲
 * @param params - レベル・難易度・検索キーワードなどのフィルター条件
 * @returns タイムライン配列・ローディング状態・ページング操作
 */
export const useTimeline = (
  mode: "all" | "played" | "overtaken",
  params: FilterParamsFrontend,
) => {
  const { fbUser } = useUser();

  const {
    items,
    size,
    setSize,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError,
  } = useInfiniteList<TimelineResponse, TimelineEntry>(
    (pageIndex, previousPageData: TimelineResponse | null) => {
      if (!fbUser) return null;
      if (previousPageData && !previousPageData.nextId) return null;

      const query = new URLSearchParams();
      query.append("mode", mode);
      if (params.search) query.append("search", params.search);
      if (params.levels?.length) {
        params.levels.forEach((lv) => query.append("levels[]", lv.toString()));
      }
      if (params.difficulties?.length) {
        params.difficulties.forEach((df) => query.append("difficulties[]", df));
      }
      if (pageIndex > 0 && previousPageData?.nextId) {
        query.append("lastId", previousPageData.nextId);
      }

      return [
        `${API_PREFIX}/users/${fbUser.uid}/timeline?${query.toString()}`,
        fbUser,
      ];
    },
    {
      getItems: (page) => page.timeline,
      isLastPage: (page) => page?.nextId === null,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      keepPreviousData: false,
    },
  );

  return {
    timeline: items,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError,
    size,
    setSize,
  };
};
