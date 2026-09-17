import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

/** カスタム目標作成画面の`CustomGoalTargetInput`にそのまま設定できる形。 */
export interface ImportedGoalTarget {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  toExScore: number;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

/**
 * 他ユーザーが共有したreportIdから曲目(songId+目標EXスコア)を読み取り、
 * インポートする側の最新の曲データで引き直した曲目一覧を取得する。
 */
export async function fetchImportOptimizeMemo(
  userId: string,
  fbUser: FirebaseUser | null | undefined,
  reportId: string,
): Promise<ImportedGoalTarget[]> {
  const res = await authFetch(
    `/api/v2/users/${userId}/analytics/bpi-optimizer/import/${encodeURIComponent(reportId)}`,
    "GET",
    fbUser ?? null,
  );
  const { targets } = await unwrapApiResponse<{
    targets: ImportedGoalTarget[];
  }>(res);
  return targets;
}
