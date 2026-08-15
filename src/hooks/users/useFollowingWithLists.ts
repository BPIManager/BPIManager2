import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { invalidateFollowListsCache } from "./followListsCache";
import type { FollowingWithLists } from "@/types/users/followList";

interface FollowingWithListsResponse {
  following: FollowingWithLists[];
}

/**
 * フォロー中の全ユーザーを、それぞれが所属する自分のリストID一覧付きで取得し、
 * リスト所属の追加・削除を管理するフック。
 *
 * `/rivals`編集モードの行リスト（ユーザー×所属リストのSelect）に使う。
 *
 * @param userId - 自分のユーザー ID（未ログイン時は `false`）
 */
export const useFollowingWithLists = (userId?: string | boolean) => {
  const { fbUser } = useUser();
  const url =
    userId && typeof userId === "string"
      ? `${API_PREFIX}/users/${userId}/follow-lists/following`
      : null;

  const { data, error, isLoading, mutate } =
    useAuthedSWR<FollowingWithListsResponse>(url, {
      revalidateOnFocus: false,
    });

  const addToList = async (listId: number, followingId: string) => {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_PREFIX}/users/${fbUser.uid}/follow-lists/${listId}/members/${followingId}`,
      "PUT",
      fbUser,
    );
    if (!res.ok) throw new Error("Failed to add to follow list");
    // メンバー数(useFollowListsの一覧)側も合わせて再検証する
    await invalidateFollowListsCache(fbUser.uid);
  };

  const removeFromList = async (listId: number, followingId: string) => {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_PREFIX}/users/${fbUser.uid}/follow-lists/${listId}/members/${followingId}`,
      "DELETE",
      fbUser,
    );
    if (!res.ok) throw new Error("Failed to remove from follow list");
    await invalidateFollowListsCache(fbUser.uid);
  };

  return {
    following: data?.following ?? [],
    isLoading,
    isError: error,
    addToList,
    removeFromList,
    mutate,
  };
};
