import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export interface PendingFollowRequest {
  id: number;
  createdAt: string;
  requesterId: string;
  requesterName: string;
  requesterImage: string | null;
}

/**
 * 自分宛の保留中フォローリクエスト一覧・承認/却下操作を管理するフック。
 */
export const useFollowRequests = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWR<{
    requests: PendingFollowRequest[];
  }>(fbUser ? `${API_PREFIX}/users/${fbUser.uid}/follow-requests` : null);

  const approve = async (requestId: number) => {
    if (!fbUser) return;
    await authFetch(
      `${API_PREFIX}/users/${fbUser.uid}/follow-requests/${requestId}`,
      "POST",
      fbUser,
    );
    mutate();
  };

  const reject = async (requestId: number) => {
    if (!fbUser) return;
    await authFetch(
      `${API_PREFIX}/users/${fbUser.uid}/follow-requests/${requestId}`,
      "DELETE",
      fbUser,
    );
    mutate();
  };

  return {
    requests: data?.requests ?? [],
    isLoading,
    approve,
    reject,
  };
};
