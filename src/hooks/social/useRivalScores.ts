import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { API_PREFIX } from "@/constants/apiEndpoints";

/**
 * 指定楽曲のフォロー中ライバル全員のスコアを取得する。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 * @returns ライバルスコアデータ・ローディング状態・エラー・更新関数・再検証中フラグ
 */
export const useRivalScores = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    fbUser && songId
      ? `${API_PREFIX}/users/${fbUser.uid}/rivals/following/scores/${songId}?version=${version || latestVersion}`
      : null,
    fetcher,
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    isValidating,
  };
};
