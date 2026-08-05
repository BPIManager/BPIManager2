import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { requestFollowUser } from "@/services/swr/follow";

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
      const data = await requestFollowUser(targetUserId, isFollowing, fbUser);
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
