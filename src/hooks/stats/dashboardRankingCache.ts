import { mutate as globalMutate } from "swr";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * ダッシュボードのランキングカード（近傍おすすめ・僅差ライバル）の SWR キャッシュをまとめて再検証する。
 * 手動スコア保存後に両方が更新されるよう、invalidateFollowListsCache と同じ方式で一括再検証する。
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
