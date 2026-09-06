import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

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
  const url =
    fbUser && songId
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/rivals/following/scores/${songId}?version=${version || latestVersion}`
      : null;
  const { data, error, isLoading, mutate, isValidating } = useAuthedSWRV2(url);

  return {
    data,
    isLoading,
    error,
    mutate,
    isValidating,
  };
};
