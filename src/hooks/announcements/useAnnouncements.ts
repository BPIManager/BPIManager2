import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { AnnouncementsResponse } from "@/types/announcements";

/**
 * お知らせ一覧と未読件数を取得する。未ログインでも一覧は取得できる（未読件数は 0）。
 */
export function useAnnouncements() {
  const { data, mutate } = useAuthedSWRV2<AnnouncementsResponse>(
    `${API_V2_PREFIX}/announcements`,
    { revalidateOnFocus: false },
  );

  return {
    items: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    refresh: mutate,
  };
}
