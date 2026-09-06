import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { SongHistoryResponse } from "@/types/songs/score";

/**
 * 全バージョンにまたがる指定楽曲のスコア履歴を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param enabled - false の場合はフェッチしない（デフォルト: false）
 * @returns スコア履歴グループ・ローディング状態・エラー情報
 */
export const useAllScoreHistory = (
  userId: string | undefined,
  songId: number | null,
  enabled = true,
) => {
  const { data, error, isLoading } = useAuthedSWRV2<SongHistoryResponse>(
    enabled && userId && songId
      ? `${API_V2_PREFIX}/users/${userId}/all-scores/${songId}/history`
      : null,
  );

  return { historyGroups: data, isLoading, isError: error };
};
