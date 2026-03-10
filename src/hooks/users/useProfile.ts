import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { useState } from "react";

export interface UserProfileHistory {
  version: string;
  totalBpi: number | null;
  arenaRank: string;
  updatedAt: string | Date;
}

export interface UserProfileResponse {
  userId: string;
  userName: string;
  profileText: string | null;
  profileImage: string | null;
  iidxId: string | null;
  xId: string | null;
  isPublic: number;
  history: UserProfileHistory[];
  current: UserProfileHistory | null;
}

export const useProfile = (userId: string | undefined) => {
  const { fbUser } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<UserProfileResponse>(
    userId ? [`/api/user/${userId}`, fbUser] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const toggleFollow = async () => {
    if (!userId || !fbUser || isUpdating) return;

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

      await mutate();
    } catch (e) {
      console.error("Follow error:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile: data,
    isLoading,
    isUpdating,
    isPrivate: error?.status === 403,
    isNotFound: error?.status === 404,
    isError: error,
    mutate,
    toggleFollow,
  };
};
