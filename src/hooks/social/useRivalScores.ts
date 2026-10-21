import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * 指定楽曲のフォロー中ライバル全員のスコアを取得する。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 * @param includeUserIds - フォロー外でも結果に含めるユーザーID（ライバルページで表示中の相手と自分）
 * @returns ライバルスコアデータ・ローディング状態・エラー・更新関数・再検証中フラグ
 */
export const useRivalScores = (
  songId: number | null,
  version: string | null,
  includeUserIds: string[] = [],
) => {
  const { fbUser } = useUser();
  const includeQuery = includeUserIds
    .map((id) => `&includeUserIds=${encodeURIComponent(id)}`)
    .join("");
  const url =
    fbUser && songId
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/rivals/following/scores/${songId}?version=${version || latestVersion}${includeQuery}`
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
