import type { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

/**
 * 一覧に表示中のお知らせをまとめて既読にする。
 *
 * @param fbUser - 対象ユーザー
 */
export async function markAnnouncementsRead(fbUser: FirebaseUser): Promise<{ marked: number }> {
  const res = await authFetch(`${API_V2_PREFIX}/announcements/read`, "POST", fbUser);
  return unwrapApiResponse<{ marked: number }>(res);
}
