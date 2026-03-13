import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";

export const useFollow = (userId: string | undefined) => {
  const { fbUser, refresh } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFollow = async (onSuccess?: () => void) => {
    if (!userId || !fbUser || isUpdating) return null;

    setIsUpdating(true);
    try {
      const token = await fbUser.getIdToken();
      const res = await fetch(`/api/${userId}/toggleFollow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Follow request failed");

      if (refresh) await refresh();
      if (onSuccess) onSuccess();

      return true;
    } catch (e) {
      console.error("Follow error:", e);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { toggleFollow, isUpdating };
};
