import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";
import type { BpmBand } from "@/constants/iidx/bpm";
import type { RadarCategory } from "@/types/stats/radar";

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
  bpmBand: BpmBand;
  radarCategory: RadarCategory | null;
}

/**
 * BPI最適化対象楽曲（☆12）について、指定したデータセット
 * （特定バージョンでのスコア、または全バージョン横断の自己歴代ベスト）での
 * 曲ごとのEXスコア一覧を取得する。「自己べを目指す」機能向け。
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
