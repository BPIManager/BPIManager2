import { User as FirebaseUser } from "firebase/auth";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export interface CustomGoalTarget {
  songId: number;
  toExScore: number;
}

/**
 * ユーザーが選んだ曲＋目標EXスコアの組から、現在→目標の総合BPIと
 * 各曲のfromBpi/toBpiを計算する。返り値はそのまま`saveMemo`(kind: "custom")
 * に渡せる`OptimizationResult`の形。
 */
export async function fetchCustomGoalPreview(
  userId: string,
  fbUser: FirebaseUser | null | undefined,
  targets: CustomGoalTarget[],
): Promise<OptimizationResult> {
  const res = await authFetch(
    `/api/v2/users/${userId}/analytics/bpi-optimizer/custom-preview`,
    "POST",
    fbUser ?? null,
    { targets },
  );
  return unwrapApiResponse<OptimizationResult>(res);
}
