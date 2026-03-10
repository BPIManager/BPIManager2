import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";

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

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<FollowListResponse>(
      (index) =>
        userId
          ? [
              `/api/${userId}/follows?type=${type}&page=${index + 1}&limit=20`,
              fbUser,
            ]
          : null,
      fetcher,
      { revalidateFirstPage: false },
    );

  const users = data ? data.flatMap((page) => page.users) : [];
  const isLoading = (!data && !error) || isValidating;
  const isReachingEnd = data && !data[data.length - 1]?.hasMore;

  return {
    users,
    totalCount: data?.[0]?.totalCount ?? 0,
    isLoading,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
    mutate,
  };
};
