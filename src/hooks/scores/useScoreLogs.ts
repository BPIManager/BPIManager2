import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { SongHistoryResponse } from "@/types/songs/score";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";

/**
 * 指定楽曲のスコア履歴を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param songId - 楽曲 ID
 * @param enabled - false の場合はフェッチしない（デフォルト: true）
 * @returns スコア履歴グループ・ローディング状態・エラー情報
 */
export const useScoreHistory = (
  userId: string | undefined,
  songId: number,
  enabled = true,
) => {
  const { data, error, isLoading } = useAuthedSWRV2<SongHistoryResponse>(
    enabled && userId && songId
      ? `${API_V2_PREFIX}/users/${userId}/scores/${songId}/history`
      : null,
  );

  return {
    historyGroups: data,
    isLoading,
    isError: error,
  };
};
