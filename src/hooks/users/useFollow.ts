import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";

export const useFollow = (targetUserId: string | undefined) => {
  const { fbUser, refresh } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const requestFollow = async (isFollowing: boolean) => {
    if (!targetUserId || !fbUser || isUpdating) return null;

    setIsUpdating(true);
    try {
      const token = await fbUser.getIdToken();
      const method = isFollowing ? "DELETE" : "PUT";

      const res = await fetch(`/api/${targetUserId}/follows`, {
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
