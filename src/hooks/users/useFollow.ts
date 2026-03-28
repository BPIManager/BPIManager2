import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";

/**
 * 指定ユーザーへのフォロー / アンフォロー操作を行うフック。
 *
 * @param targetUserId - フォロー対象ユーザー ID
 * @returns フォロー操作関数（現在フォロー中なら解除、そうでなければフォロー）・処理中フラグ
 */
export const useFollow = (targetUserId: string | undefined) => {
  const { fbUser, refresh } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const requestFollow = async (isFollowing: boolean) => {
    if (!targetUserId || !fbUser || isUpdating) return null;

    setIsUpdating(true);
    try {
      const token = await fbUser.getIdToken();
      const method = isFollowing ? "DELETE" : "PUT";

      const res = await fetch(`${API_PREFIX}/users/${targetUserId}/follows`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Failed to ${method} follow`);

      const data = await res.json();
      refresh();
      return data.isFollowing;
    } catch (e) {
      console.error("Follow error:", e);
      throw e;
    } finally {
      setIsUpdating(false);
    }
  };

  return { requestFollow, isUpdating };
};
