import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";

export interface RecommendedUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  arenaRank: string;
  totalBpi: number;
  iidxId: string;
  radar: Record<string, number>;
  updatedAt: string;
}

interface UserListResponse {
  viewer: {
    userId: string;
    totalBpi: number;
    radar: any;
  };
  users: RecommendedUser[];
}

export const useUserList = (
  q: string = "",
  page: number = 1,
  sort: string = "totalBpi",
  order: string = "distance",
) => {
  const { fbUser } = useUser();

  const searchParams = new URLSearchParams();
  if (q) searchParams.append("q", q);
  searchParams.append("p", page.toString());
  searchParams.append("s", sort);
  searchParams.append("o", order);

  const { data, error, isLoading, mutate } = useSWR<UserListResponse>(
    fbUser
      ? [
          `/api/${fbUser?.uid}/rivals/suggestions?${searchParams.toString()}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error, mutate };
};
