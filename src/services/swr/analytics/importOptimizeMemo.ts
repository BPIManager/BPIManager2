import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";
import type { ImportedGoalTarget } from "@/types/analytics/importedGoalTarget";
import { unwrapApiResponse } from "@/services/swr/fetchV2";


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
