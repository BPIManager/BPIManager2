import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
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
 * 自分宛の「承認待ち」一覧・承認/却下操作を管理するフック。
 *
 * `kind: "request"`(招待URL経由の本物のリクエスト)と`kind: "legacy"`
 * (承認記録を持たない既存フォロワー。自分が公開だった時代に成立)を
 * 統合して扱う。承認/却下の実行先エンドポイントはkindによって異なる。
 */
export const useFollowRequests = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWR<{
    requests: PendingFollowRequest[];
  }>(fbUser ? `${API_PREFIX}/users/${fbUser.uid}/follow-requests` : null);

  const approve = async (request: PendingFollowRequest) => {
    if (!fbUser) return;
    const url =
      request.kind === "request"
        ? `${API_PREFIX}/users/${fbUser.uid}/follow-requests/${request.id}`
        : `${API_PREFIX}/users/${fbUser.uid}/followers/${request.requesterId}`;
    await authFetch(url, "POST", fbUser);
    mutate();
  };

  const reject = async (request: PendingFollowRequest) => {
    if (!fbUser) return;
    const url =
      request.kind === "request"
        ? `${API_PREFIX}/users/${fbUser.uid}/follow-requests/${request.id}`
        : `${API_PREFIX}/users/${fbUser.uid}/followers/${request.requesterId}`;
    await authFetch(url, "DELETE", fbUser);
    mutate();
  };

  return {
    requests: data?.requests ?? [],
    isLoading,
    approve,
    reject,
  };
};
