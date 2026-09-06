import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { UpdateLog } from "@/types/logs/batches";

/**
 * ユーザーのスコア更新ログ一覧を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン文字列
 * @param groupedBy - グループ化単位（`"batch"` | `"date"` など）
 * @returns ログ配列・ローディング状態・エラー情報
 */
export const useBatchesList = (
  userId: string | undefined,
  version: string,
  groupedBy: string,
) => {
  const { data, error, isLoading } = useAuthedSWRV2<UpdateLog[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/batches?version=${version}&groupedBy=${groupedBy}`
      : null,
  );
  return { logs: data || [], isLoading, isError: error };
};
