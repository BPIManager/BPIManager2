import { mutate as globalMutate } from "swr";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * ダッシュボードのランキングカード(近傍おすすめ・僅差ライバル)のSWR
 * キャッシュをまとめて再検証する。両者は別々のエンドポイント・SWRキーで
 * 管理されているため、手動EXスコア保存後にどちらの一覧も更新されるよう
 * ここで一括再検証する(`invalidateFollowListsCache`と同じ方式)。
 *
 * @param userId - 対象ユーザー ID
 */
export function invalidateDashboardRankingCache(userId: string) {
  const neighborPrefix = `${API_V2_PREFIX}/users/${userId}/stats/neighbor-recommended`;
  const nearLosePrefix = `${API_V2_PREFIX}/users/${userId}/rivals/following/scores`;
  return globalMutate(
    (key) =>
      Array.isArray(key) &&
      typeof key[0] === "string" &&
      (key[0].startsWith(neighborPrefix) || key[0].startsWith(nearLosePrefix)),
  );
}
