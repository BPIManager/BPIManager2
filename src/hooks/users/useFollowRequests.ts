import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

interface PendingFollowRequestBase {
  createdAt: string;
  requesterId: string;
  requesterName: string;
  requesterImage: string | null;
}

export type PendingFollowRequest =
  | (PendingFollowRequestBase & { kind: "request"; id: number })
  | (PendingFollowRequestBase & { kind: "legacy" });

/**
 * 自分宛の承認待ち一覧と承認・却下操作を管理する。招待URL経由の request と、承認記録を持たない legacy を統合して扱う。
 * 承認・却下の実行先エンドポイントは kind によって異なる。
 */
export const useFollowRequests = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWRV2<{
    requests: PendingFollowRequest[];
  }>(fbUser ? `${API_V2_PREFIX}/users/${fbUser.uid}/follow-requests` : null);

  const approve = async (request: PendingFollowRequest) => {
    if (!fbUser) return;
    const url =
      request.kind === "request"
        ? `${API_V2_PREFIX}/users/${fbUser.uid}/follow-requests/${request.id}`
        : `${API_V2_PREFIX}/users/${fbUser.uid}/followers/${request.requesterId}`;
    const res = await authFetch(url, "POST", fbUser);
    if (!res.ok) throw new Error("Failed to approve follow request");
    mutate();
  };

  const reject = async (request: PendingFollowRequest) => {
    if (!fbUser) return;
    const url =
      request.kind === "request"
        ? `${API_V2_PREFIX}/users/${fbUser.uid}/follow-requests/${request.id}`
        : `${API_V2_PREFIX}/users/${fbUser.uid}/followers/${request.requesterId}`;
    const res = await authFetch(url, "DELETE", fbUser);
    if (!res.ok) throw new Error("Failed to reject follow request");
    mutate();
  };

  return {
    requests: data?.requests ?? [],
    isLoading,
    approve,
    reject,
  };
};
