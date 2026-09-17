import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export interface SongContributionTarget {
  songId: number;
  baselineExScore: number | null;
}

export interface SongContributionResponse {
  currentTotalBpi: number;
  contributions: { songId: number; contribution: number }[];
}

/**
 * 保存済み目標の曲ごとに、プラン保存時点からのスコア更新が現在の総合BPIに
 * どれだけ寄与しているかを計算する。
 */
export async function fetchSongContribution(
  userId: string,
  fbUser: FirebaseUser | null | undefined,
  targets: SongContributionTarget[],
): Promise<SongContributionResponse> {
  const res = await authFetch(
    `/api/v2/users/${userId}/analytics/bpi-optimizer/song-contribution`,
    "POST",
    fbUser ?? null,
    { targets },
  );
  return unwrapApiResponse<SongContributionResponse>(res);
}
