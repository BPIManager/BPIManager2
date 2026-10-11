import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export interface ApprovedFollower {
  followerId: string;
  followerName: string;
  followerImage: string | null;
  followedAt: string;
  approvedAt: string;
}

/**
 * 自分が閲覧を承認済みのフォロワー一覧と、閲覧権限だけの取り消しを管理する。
 * 取り消してもフォロー関係は残り、相手は「承認待ち」に戻る。
 *
 * @param enabled - false の間は取得しない（非公開アカウントでのみ使う場合に呼び出し側が絞る）
 */
export const useViewPermissions = (enabled = true) => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWRV2<{
    approved: ApprovedFollower[];
  }>(
    fbUser && enabled
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/view-permissions`
      : null,
  );

  const revoke = async (followerId: string) => {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_V2_PREFIX}/users/${fbUser.uid}/view-permissions/${followerId}`,
      "DELETE",
      fbUser,
    );
    if (!res.ok) throw new Error("Failed to revoke view permission");
    await mutate();
  };

  return {
    approved: data?.approved ?? [],
    isLoading,
    revoke,
    refresh: mutate,
  };
};
