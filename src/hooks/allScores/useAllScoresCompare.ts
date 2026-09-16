import { SongWithScore } from "@/types/songs/score";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * 全曲一覧（☆10以下含む）の、指定バージョン時点とのスコア比較データを取得する。
 * `/my/[version]`の`useCompareScores`と異なり「現在」は特定バージョンに紐付かない
 * （常に最新スコア）ため、`targetVersion`のみを受け取る。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param compareVersion - 比較対象バージョン（`"none"`または未指定ならフェッチしない）
 * @returns 比較スコアデータ・ローディング状態・エラー情報
 */
export const useAllScoresCompare = (
  userId: string | undefined,
  compareVersion: string | undefined,
) => {
  const shouldFetch = !!userId && !!compareVersion && compareVersion !== "none";

  const { data, error, isLoading } = useAuthedSWRV2<SongWithScore[]>(
    shouldFetch
      ? `${API_V2_PREFIX}/users/${userId}/all-scores/self-version?targetVersion=${compareVersion}`
      : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    compareData: data,
    compareError: error,
    isCompareLoading: isLoading,
  };
};
