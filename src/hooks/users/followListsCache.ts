import { mutate as globalMutate } from "swr";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * フォローリスト関連のSWRキャッシュ(`follow-lists`一覧・
 * `follow-lists/following`所属状況)をまとめて再検証する。
 *
 * 両エンドポイントは別々のSWRキーで管理されているが、リストの作成・
 * 削除はユーザーの所属状況(`following`)に、メンバーの追加・削除は
 * リストのメンバー数(`follow-lists`一覧)に、互いに影響する。個別の
 * フックが自分の`mutate()`だけを呼ぶと相手側が古いままになるため
 * (#277フォロー後方修正)、どちらの操作後もこのヘルパーで両方
 * 再検証する。
 *
 * `useAuthedSWR`のキーは`[url, fbUserUid]`の配列のため、URLの前方一致で
 * 該当キー全てにマッチさせる。
 *
 * @param userId - 対象ユーザー ID
 */
export function invalidateFollowListsCache(userId: string) {
  const prefix = `${API_PREFIX}/users/${userId}/follow-lists`;
  return globalMutate(
    (key) => Array.isArray(key) && typeof key[0] === "string" && key[0].startsWith(prefix),
  );
}
