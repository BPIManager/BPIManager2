import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { useFollow } from "./useFollow";
import { UserProfileResponse } from "@/types/users/profile";

export const useProfile = (userId: string | undefined) => {
  const { fbUser } = useUser();
  const { toggleFollow, isUpdating } = useFollow(userId);

  const { data, error, isLoading, mutate } = useSWR<UserProfileResponse>(
    fbUser && userId ? [`/api/${userId}/profile`, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    profile: data?.profile,
    compare: data?.compare,
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
