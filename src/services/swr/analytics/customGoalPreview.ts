import { User as FirebaseUser } from "firebase/auth";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export interface CustomGoalTarget {
  songId: number;
  toExScore: number;
}

/**
 * 選んだ曲＋目標EXスコアから、現在→目標の総合BPIと各曲の fromBpi/toBpi を計算する。返り値は saveMemo（kind: custom）に渡せる OptimizationResult。
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
