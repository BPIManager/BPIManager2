import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

/** フォロー / フォロワーリストの1ユーザー */
export interface FollowUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  profileText: string | null;
  totalBpi: number | null;
  arenaRank: string | null;
  /** 閲覧者がこのユーザーをフォローしているか */
  isViewerFollowing: boolean;
  /** このユーザーが閲覧者自身か */
  isSelf: boolean;
}

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

  const { items, size, setSize, isLoading, isReachingEnd, mutate } =
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
    totalCount: 0,
    isLoading,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
    mutate,
  };
};
