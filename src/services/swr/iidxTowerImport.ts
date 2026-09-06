import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export async function submitTowerImport(
  userId: string,
  fbUser: FirebaseUser,
  version: string,
  rows: unknown[],
) {
  const response = await authFetch(
    `${API_V2_PREFIX}/users/${userId}/iidx-tower`,
    "POST",
    fbUser,
    { version, rows },
    true,
  );

  if (!response.ok) throw new Error("サーバーエラーが発生しました。");

  return unwrapApiResponse<{ success: boolean; upsertedCount: number }>(
    response,
  );
}
