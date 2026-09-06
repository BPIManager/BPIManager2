import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

/**
 * 任意のフォロワーを強制的にフォロー解除するフック。
 *
 * 恒久的なブロックではないため、相手は招待URLがあれば再度リクエストを
 * 送信できる。
 *
 * @param followerId - 解除対象のフォロワーのユーザー ID
 */
export const useForceUnfollow = (followerId: string) => {
  const { fbUser, refresh } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const forceUnfollow = async () => {
    if (!fbUser || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await authFetch(
        `${API_V2_PREFIX}/users/${fbUser.uid}/followers/${followerId}`,
        "DELETE",
        fbUser,
      );
      if (!res.ok) {
        throw new Error("Failed to force-unfollow");
      }
      refresh();
    } finally {
      setIsUpdating(false);
    }
  };

  return { forceUnfollow, isUpdating };
};
