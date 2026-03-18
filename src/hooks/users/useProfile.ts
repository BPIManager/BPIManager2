import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { useFollow } from "./useFollow";
import { UserProfileResponse } from "@/types/users/profile";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { toast } from "sonner";

export const useProfile = (userId: string | undefined) => {
  const { fbUser, isLoading: fbLoading } = useUser();
  const { requestFollow, isUpdating } = useFollow(userId);

  const { data, error, isLoading, mutate } = useSWR<UserProfileResponse>(
    !fbLoading && userId
      ? [`${API_PREFIX}/users/${userId}/profile`, fbUser]
      : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const handleToggleFollow = async () => {
    if (!data?.profile || isUpdating) return;

    const currentStatus = data.profile.relationship.isFollowing;

    const optimisticData: UserProfileResponse = {
      ...data,
      profile: {
        ...data.profile,
        follows: {
          ...data.profile.follows,
          followers: data.profile.follows.followers + (currentStatus ? -1 : 1),
        },
        relationship: {
          ...data.profile.relationship,
          isFollowing: !currentStatus,
        },
      },
    };

    try {
      await mutate(
        requestFollow(currentStatus).then(() => optimisticData),
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: true,
        },
      );
    } catch (e) {
      toast.error("操作が完了しませんでした");
    }
  };

  return {
    profile: data?.profile,
    compare: data?.compare,
    isLoading: isLoading || fbLoading,
    isUpdating,
    isPrivate: error?.status === 403,
    isNotFound: error?.status === 404,
    isError: error,
    mutate,
    toggleFollow: handleToggleFollow,
  };
};
