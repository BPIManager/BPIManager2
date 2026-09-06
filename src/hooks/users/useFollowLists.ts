import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";
import { invalidateFollowListsCache } from "./followListsCache";
import type { FollowListSummary } from "@/types/users/followList";

interface FollowListsResponse {
  lists: FollowListSummary[];
}

/**
 * 自分が作成したフォローリストの一覧取得・作成・改名・公開設定変更・削除を
 * 管理するフック。
 *
 * Vaulドロワーでのリスト管理・`/rivals`のリストフィルタ選択肢に使う。
 *
 * @param userId - 自分のユーザー ID（未ログイン時は `false`）
 */
export const useFollowLists = (userId?: string | boolean) => {
  const { fbUser } = useUser();
  const url =
    userId && typeof userId === "string"
      ? `${API_V2_PREFIX}/users/${userId}/follow-lists`
      : null;

  const { data, error, isLoading, mutate } = useAuthedSWRV2<FollowListsResponse>(
    url,
    { revalidateOnFocus: false },
  );

  const createList = async (
    name: string,
    isPublic: boolean,
  ): Promise<number | undefined> => {
    if (!fbUser) return undefined;
    const res = await authFetch(
      `${API_V2_PREFIX}/users/${fbUser.uid}/follow-lists`,
      "POST",
      fbUser,
      { name, isPublic },
    );
    if (!res.ok) throw new Error("Failed to create follow list");
    const { id } = await unwrapApiResponse<{ id: number }>(res);
    await invalidateFollowListsCache(fbUser.uid);
    return id;
  };

  const renameList = async (listId: number, name: string) => {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_V2_PREFIX}/users/${fbUser.uid}/follow-lists/${listId}`,
      "PATCH",
      fbUser,
      { name },
    );
    if (!res.ok) throw new Error("Failed to rename follow list");
    await invalidateFollowListsCache(fbUser.uid);
  };

  const setListPublic = async (listId: number, isPublic: boolean) => {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_V2_PREFIX}/users/${fbUser.uid}/follow-lists/${listId}`,
      "PATCH",
      fbUser,
      { isPublic },
    );
    if (!res.ok) throw new Error("Failed to update follow list");
    await invalidateFollowListsCache(fbUser.uid);
  };

  const deleteList = async (listId: number) => {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_V2_PREFIX}/users/${fbUser.uid}/follow-lists/${listId}`,
      "DELETE",
      fbUser,
    );
    if (!res.ok) throw new Error("Failed to delete follow list");
    // 削除したリストへの所属は連鎖削除されるため、フォロー中一覧側の
    // listIdsキャッシュ(useFollowingWithLists)も合わせて再検証する
    await invalidateFollowListsCache(fbUser.uid);
  };

  return {
    lists: data?.lists ?? [],
    isLoading,
    isError: error,
    createList,
    renameList,
    setListPublic,
    deleteList,
    mutate,
  };
};
