import { mutate as globalMutate } from "swr";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * フォローリスト一覧（follow-lists）と所属状況（following）のSWRキャッシュを両方再検証する。
 * 作成・削除・メンバー変更は互いのキーに影響するため、どちらの操作後もこのヘルパーで両方を更新する。
 *
 * @param userId - 対象ユーザー ID
 */
export function invalidateFollowListsCache(userId: string) {
  const prefix = `${API_V2_PREFIX}/users/${userId}/follow-lists`;
  return globalMutate(
    (key) => Array.isArray(key) && typeof key[0] === "string" && key[0].startsWith(prefix),
  );
}
