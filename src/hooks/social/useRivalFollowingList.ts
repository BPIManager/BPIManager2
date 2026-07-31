import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
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
  const url = userId
    ? `${API_PREFIX}/users/${userId}/rivals/following/list`
    : null;

  const { data, error, isLoading } = useAuthedSWR<RivalListResponse>(url, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    rivals: data?.rivals ?? [],
    isLoading,
    isError: error,
  };
};
