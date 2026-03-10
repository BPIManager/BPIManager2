import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";

export interface RecommendedUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  arenaRank: string;
  totalBpi: number;
  radar: Record<string, number>;
}

interface UserListResponse {
  viewer: {
    userId: string;
    totalBpi: number;
    radar: any;
  };
  users: RecommendedUser[];
}

export const useUserList = () => {
  const { fbUser } = useUser();
  const { data, error, isLoading } = useSWR<UserListResponse>(
    fbUser ? [`/api/${fbUser?.uid}/rivals/recommended`, fbUser] : null,
    fetcher,
  );

  return {
    data,
    isLoading,
    isError: error,
  };
};
