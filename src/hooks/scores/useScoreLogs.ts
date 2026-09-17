import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { SongHistoryResponse } from "@/types/songs/score";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";

/**
 * 指定楽曲のスコア履歴を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param songId - 楽曲 ID
 * @returns スコア履歴グループ・ローディング状態・エラー情報
 */
export const useScoreHistory = (userId: string | undefined, songId: number) => {
  const { data, error, isLoading } = useAuthedSWRV2<SongHistoryResponse>(
    userId && songId
      ? `${API_V2_PREFIX}/users/${userId}/scores/${songId}/history`
      : null,
  );

  return {
    historyGroups: data,
    isLoading,
    isError: error,
  };
};
