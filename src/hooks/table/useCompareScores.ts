import { SongWithScore } from "@/types/songs/score";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * 異なる IIDX バージョン間のスコア比較データを取得する。
 * `compareVersion` が `"none"` または `currentVersion` と同一の場合はフェッチしない。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param currentVersion - 現在表示中のバージョン
 * @param compareVersion - 比較対象のバージョン
 * @returns 比較スコアデータ・ローディング状態・エラー情報
 */
export const useCompareScores = (
  userId: string | undefined,
  currentVersion: string | undefined,
  compareVersion: string | undefined,
) => {
  const shouldFetch =
    !!userId &&
    !!currentVersion &&
    !!compareVersion &&
    compareVersion !== "none" &&
    compareVersion !== currentVersion;

  const { data, error, isLoading } = useAuthedSWRV2<SongWithScore[]>(
    shouldFetch
      ? `${API_V2_PREFIX}/users/${userId}/scores/self-version?currentVersion=${currentVersion}&targetVersion=${compareVersion}`
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
