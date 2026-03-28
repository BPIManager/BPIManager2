import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";
import type {
  NotificationItem,
  NotificationCountResponse,
} from "@/types/users/notifications";

/**
 * ページネーション付き通知一覧と未読件数を管理するフック。
 *
 * @param type - 取得する通知種別（デフォルト: `"all"`）
 * @returns 通知配列・未読件数・ローディング状態・既読化関数・ページング操作
 */
export const useNotifications = (
  type: "all" | "follow" | "overtaken" = "all",
) => {
  const { fbUser, isLoading: fbLoading } = useUser();

  const { data: countData, mutate: mutateCount } =
    useSWR<NotificationCountResponse>(
      !fbLoading && fbUser
        ? [`${API_PREFIX}/users/${fbUser.uid}/notifications/count`, fbUser]
        : null,
      fetcher,
    );

  const {
    items: notifications,
    size,
    setSize,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    mutate: mutateList,
  } = useInfiniteList<NotificationItem[], NotificationItem>(
    (index) => {
      if (fbLoading || !fbUser?.uid) return null;
      return [
        `${API_PREFIX}/users/${fbUser.uid}/notifications?type=${type}&page=${index}&limit=20`,
        fbUser,
      ];
    },
    {
      getItems: (page) => page,
      isLastPage: (page) => page.length < 20,
      revalidateOnFocus: false,
    },
  );

  const markAsRead = async () => {
    if (!fbUser) return;
    try {
      await fetch(`${API_PREFIX}/users/${fbUser.uid}/notifications`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await fbUser?.getIdToken()}` },
      });
      mutateCount({ total: 0 }, { revalidate: false });
    } catch (e) {
      console.error(e);
    }
  };

  return {
    notifications,
    unreadCount: countData?.total ?? 0,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    size,
    setSize,
    markAsRead,
    mutateList,
  };
};
