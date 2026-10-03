import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useInfiniteListV2 } from "@/services/swr/useInfinite";
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
const getNotificationItems = (page: NotificationItem[]) => page;

export const useNotifications = (
  type: "all" | "follow" | "overtaken" | "followApproved" = "all",
) => {
  const { fbUser, isLoading: fbLoading } = useUser();

  const { data: countData, mutate: mutateCount } =
    useAuthedSWRV2<NotificationCountResponse>(
      !fbLoading && fbUser
        ? `${API_V2_PREFIX}/users/${fbUser.uid}/notifications/count`
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
  } = useInfiniteListV2<NotificationItem[], NotificationItem>(
    (index) => {
      if (fbLoading || !fbUser?.uid) return null;
      return `${API_V2_PREFIX}/users/${fbUser.uid}/notifications?type=${type}&page=${index}&limit=20`;
    },
    {
      getItems: getNotificationItems,
      isLastPage: (page) => page.length < 20,
      revalidateOnFocus: false,
    },
  );

  const markAsRead = async () => {
    if (!fbUser) return;
    try {
      await markNotificationsRead(fbUser);
      // 未読件数には対応待ちの承認リクエストも含まれ既読概念が無いため、既読化後に total:0 と決め打ちせず再取得する。
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
