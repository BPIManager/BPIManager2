import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { SongWithRival } from "@/types/songs/score";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * 自分とライバルの全楽曲スコアを並べて取得する。
 *
 * @param myUserId - 自分のユーザー ID
 * @param rivalUserId - ライバルのユーザー ID
 * @param version - IIDX バージョン（省略時は最新バージョン）
 * @returns 楽曲スコア配列・ローディング状態・エラー・更新関数・取得バージョン
 */
export const useRivalBothScores = (
  myUserId: string | undefined,
  rivalUserId: string | undefined,
  version?: string,
) => {
  const { fbUser } = useUser();
  const targetVersion = version || latestVersion;

  const { data, error, isLoading, mutate } = useAuthedSWR<SongWithRival[]>(
    myUserId && rivalUserId && fbUser
      ? `${API_PREFIX}/users/${myUserId}/rivals/${rivalUserId}/scores?version=${targetVersion}`
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
