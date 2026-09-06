import { SongWithScore } from "@/types/songs/score";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * 指定ユーザーがまだプレイしていない楽曲の一覧を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン（省略時は最新バージョン）
 * @returns 未プレイ楽曲配列・ローディング状態・エラー・更新関数・取得バージョン
 */
export const useUnplayedScores = (
  userId: string | undefined,
  version?: string,
) => {
  const targetVersion = version || latestVersion;

  const { data, error, isLoading, mutate } = useAuthedSWRV2<SongWithScore[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/scores/unplayed?version=${targetVersion}`
      : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  return {
    songs: data,
    error,
    isLoading,
    refresh: mutate,
    currentVersion: targetVersion,
  };
};
