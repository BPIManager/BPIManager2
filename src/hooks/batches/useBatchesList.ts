import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

/** バッチ更新のトップスコア情報 */
export interface TopScore {
  /** 楽曲タイトル */
  title: string;
  /** BPI 値 */
  bpi: number;
  /** クリア状態 */
  clearState: string;
}

/** スコア更新ログの1件分 */
export interface UpdateLog {
  id: number;
  batchId: string;
  /** IIDX バージョン番号 */
  version: number;
  /** バッチ時点の合計 BPI */
  totalBpi: number;
  /** 更新された楽曲数 */
  songCount: number;
  /** 前回バッチとの BPI 差分 */
  diff: number;
  createdAt: string;
  /** 上位スコア一覧 */
  topScores: TopScore[];
}

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
  const { fbUser } = useUser();
  const { data, error, isLoading } = useSWR<UpdateLog[]>(
    userId
      ? [
          `${API_PREFIX}/users/${userId}/batches?version=${version}&groupedBy=${groupedBy}`,
          fbUser,
        ]
      : null,
    fetcher,
  );
  return { logs: data || [], isLoading, isError: error };
};
