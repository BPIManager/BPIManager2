import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

import type { FollowUser } from "@/types/users/follow";

interface FollowListResponse {
  users: FollowUser[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * ユーザーのフォロー / フォロワー一覧を無限スクロールで取得する。
 *
 * @param userId - 対象ユーザー ID
 * @param type - `"following"` フォロー中一覧、`"followers"` フォロワー一覧
 * @returns ユーザー配列・ローディング状態・次ページ読み込み関数・更新関数
 */
export const useFollowList = (
  userId: string,
  type: "following" | "followers",
) => {
  const { fbUser } = useUser();

  const { items, data, size, setSize, isLoading, isReachingEnd, isError, mutate } =
    useInfiniteList<FollowListResponse, FollowUser>(
      (index) =>
        userId
          ? [
              `${API_PREFIX}/users/${userId}/follows?type=${type}&page=${index + 1}&limit=20`,
              fbUser,
            ]
          : null,
      {
        getItems: (page) => page.users,
        isLastPage: (page) => !page?.hasMore,
        revalidateFirstPage: false,
      },
    );

  return {
    users: items,
    totalCount: data?.[0]?.totalCount ?? 0,
    isLoading,
    isReachingEnd,
    isError,
    loadMore: () => setSize(size + 1),
    mutate,
  };
};
