import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

export interface FollowUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  profileText: string | null;
  totalBpi: number | null;
  arenaRank: string | null;
  isViewerFollowing: boolean;
  isSelf: boolean;
}

interface FollowListResponse {
  users: FollowUser[];
  totalCount: number;
  hasMore: boolean;
}

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
