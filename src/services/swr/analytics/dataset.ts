import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export interface BpiOptimizerDatasetRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  exScore: number | null;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

/**
 * ☆12 の曲ごとのEXスコアを、指定データセット（特定バージョン or 全バージョン横断の自己歴代ベスト）で取得する。「自己べを目指す」機能向け。
 */
export async function fetchBpiOptimizerDataset(
  userId: string,
  fbUser: FirebaseUser | null | undefined,
  source: string,
): Promise<BpiOptimizerDatasetRow[]> {
  const res = await authFetch(
    `${API_V2_PREFIX}/users/${userId}/analytics/bpi-optimizer/dataset?source=${encodeURIComponent(source)}`,
    "GET",
    fbUser ?? null,
  );
  return unwrapApiResponse<BpiOptimizerDatasetRow[]>(res);
}
