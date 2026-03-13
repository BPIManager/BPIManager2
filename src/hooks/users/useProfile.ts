import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { useState } from "react";
import { useFollow } from "./useFollow";

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
  const { toggleFollow, isUpdating } = useFollow(userId);

  const { data, error, isLoading, mutate } = useSWR<UserProfileResponse>(
    userId ? [`/api/user/${userId}`, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    profile: data,
    isLoading,
    isUpdating,
    isPrivate: error?.status === 403,
    isNotFound: error?.status === 404,
    isError: error,
    mutate,
    toggleFollow: (onSuccess?: () => void) =>
      toggleFollow(async () => {
        await mutate();
        if (onSuccess) onSuccess();
      }),
  };
};
