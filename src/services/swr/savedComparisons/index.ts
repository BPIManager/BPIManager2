import type { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";
import type { AnalyticsTarget } from "@/types/analytics";
import type { RankingTabSetting } from "@/types/analytics/saved";

export const savedComparisonsUrl = (userId: string) =>
  `${API_V2_PREFIX}/users/${userId}/saved-comparisons`;

export const rankingTabsUrl = (userId: string) =>
  `${API_V2_PREFIX}/users/${userId}/dashboard-ranking-tabs`;

/** サーバーへ送る条件から表示専用の accessible を除き、AnalyticsTarget のみにする */
const toPlainTargets = (targets: AnalyticsTarget[]): AnalyticsTarget[] =>
  targets.map(({ kind, param, version, label }) => ({ kind, param, version, label }));

async function send<T>(
  url: string,
  method: string,
  fbUser: FirebaseUser,
  body?: unknown,
): Promise<T> {
  const res = await authFetch(url, method, fbUser, body);
  return unwrapApiResponse<T>(res);
}

export const createSavedComparison = (
  fbUser: FirebaseUser,
  name: string,
  targets: AnalyticsTarget[],
) =>
  send<{ id: number }>(savedComparisonsUrl(fbUser.uid), "POST", fbUser, {
    name,
    targets: toPlainTargets(targets),
  });

export const renameSavedComparison = (
  fbUser: FirebaseUser,
  id: number,
  name: string,
) => send(`${savedComparisonsUrl(fbUser.uid)}/${id}`, "PATCH", fbUser, { name });

export const deleteSavedComparison = (fbUser: FirebaseUser, id: number) =>
  send(`${savedComparisonsUrl(fbUser.uid)}/${id}`, "DELETE", fbUser);

export const saveRankingTabs = (
  fbUser: FirebaseUser,
  tabs: RankingTabSetting[],
) => send(rankingTabsUrl(fbUser.uid), "PUT", fbUser, { tabs });
