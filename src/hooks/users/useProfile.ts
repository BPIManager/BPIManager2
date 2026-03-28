import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { useFollow } from "./useFollow";
import { UserProfileResponse } from "@/types/users/profile";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { toast } from "sonner";

/**
 * ユーザープロフィールを取得し、フォロー状態のオプティミスティック更新を提供するフック。
 * フォロートグル時はローカルキャッシュと `compare=true` キャッシュを同期更新する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @returns プロフィール・比較データ・ローディング状態・フォロートグル関数・各種エラーフラグ
 */
export const useProfile = (userId: string | undefined) => {
  const { fbUser, isLoading: fbLoading } = useUser();
  const { requestFollow, isUpdating } = useFollow(userId);
  const { mutate: globalMutate } = useSWRConfig();

  const swrKey =
    !fbLoading && userId
      ? [`${API_PREFIX}/users/${userId}/profile`, fbUser]
      : null;

  const { data, error, isLoading, mutate } = useSWR<UserProfileResponse>(
    swrKey,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const handleToggleFollow = async () => {
    if (!data?.profile || isUpdating) return;

    const currentStatus = data.profile.relationship.isFollowing;

    const updatedRelationship = {
      ...data.profile.relationship,
      isFollowing: !currentStatus,
      isMutual: !currentStatus && data.profile.relationship.isFollowedBy,
    };

    const optimisticData: UserProfileResponse = {
      ...data,
      profile: {
        ...data.profile,
        follows: {
          ...data.profile.follows,
          followers: data.profile.follows.followers + (currentStatus ? -1 : 1),
        },
        relationship: updatedRelationship,
      },
    };

    try {
      const followPromise = requestFollow(currentStatus);

      await mutate(
        followPromise.then(() => optimisticData),
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: true,
        },
      );

      if (fbUser && userId) {
        const compareKey = [
          `${API_PREFIX}/users/${userId}/profile?compare=true`,
          fbUser,
        ];
        await globalMutate(
          compareKey,
          (current: UserProfileResponse | undefined) => {
            if (!current) return current;
            return {
              ...current,
              profile: {
                ...current.profile,
                follows: {
                  ...current.profile.follows,
                  followers:
                    current.profile.follows.followers +
                    (currentStatus ? -1 : 1),
                },
                relationship: updatedRelationship,
              },
            };
          },
          { revalidate: true },
        );
      }
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
