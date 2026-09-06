import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

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
    ? `${API_V2_PREFIX}/users/${userId}/rivals/following/list`
    : null;

  const { data, error, isLoading } = useAuthedSWRV2<RivalListResponse>(url, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    rivals: data?.rivals ?? [],
    isLoading,
    isError: error,
  };
};
