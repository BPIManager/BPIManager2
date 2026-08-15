import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";
import { markNotificationsRead } from "@/services/swr/notifications";
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
  type: "all" | "follow" | "overtaken" | "followApproved" = "all",
) => {
  const { fbUser, isLoading: fbLoading } = useUser();

  const { data: countData, mutate: mutateCount } =
    useAuthedSWR<NotificationCountResponse>(
      !fbLoading && fbUser
        ? `${API_PREFIX}/users/${fbUser.uid}/notifications/count`
        : null,
    );

  const {
    items: notifications,
    size,
    setSize,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError,
    mutate: mutateList,
  } = useInfiniteList<NotificationItem[], NotificationItem>(
    (index) => {
      if (fbLoading || !fbUser?.uid) return null;
      return `${API_PREFIX}/users/${fbUser.uid}/notifications?type=${type}&page=${index}&limit=20`;
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
      await markNotificationsRead(fbUser);
      // 未読件数には承認待ちリクエスト数(既読/未読の概念を持たず、対応
      // されるまで常にカウントされる)も含まれるため、既読化後もtotal:0に
      // 決め打ちせず再取得する
      mutateCount();
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
    isError,
    size,
    setSize,
    markAsRead,
    mutateList,
  };
};
