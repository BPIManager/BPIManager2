import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { SongHistoryResponse } from "@/types/score/log";

/**
 * 全バージョンにまたがる指定楽曲のスコア履歴を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @returns スコア履歴グループ・ローディング状態・エラー情報
 */
export const useAllScoreHistory = (
  userId: string | undefined,
  songId: number | null,
) => {
  const { fbUser } = useUser();

  const { data, error, isLoading } = useSWR<SongHistoryResponse>(
    userId && songId
      ? [`${API_PREFIX}/users/${userId}/all-scores/${songId}/history`, fbUser]
      : null,
    fetcher,
  );

  return { historyGroups: data, isLoading, isError: error };
};
