import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

interface RivalListItem {
  userId: string;
  userName: string;
  profileImage: string | null;
}

interface RivalListResponse {
  rivals: RivalListItem[];
}

export const useRivalFollowingList = (userId?: string) => {
  const { fbUser } = useUser();
  const url = userId
    ? `${API_PREFIX}/users/${userId}/rivals/following/list`
    : null;

  const { data, error, isLoading } = useSWR<RivalListResponse>(
    url ? [url, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    rivals: data?.rivals ?? [],
    isLoading,
    isError: error,
  };
};
