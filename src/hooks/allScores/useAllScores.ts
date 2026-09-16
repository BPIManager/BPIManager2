import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { SongWithScore } from "@/types/songs/score";
import { latestVersion } from "@/constants/iidx/iidxVersions";

/**
 * 全難易度楽曲（☆10以下含む）の、指定バージョン時点のスコア一覧を取得する。
 * `/my/[version]`の`useUserScores`と同様、`version`時点の最新スコアを返す。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン（省略時は最新バージョン）
 * @returns 楽曲スコア配列・ローディング状態・エラー・更新関数・取得バージョン
 */
export const useAllScores = (userId: string | undefined, version?: string) => {
  const targetVersion = version || latestVersion;

  const { data, error, isLoading, mutate } = useAuthedSWRV2<SongWithScore[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/all-scores/list?version=${targetVersion}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  return {
    songs: data,
    error,
    isLoading,
    refresh: mutate,
    currentVersion: targetVersion,
  };
};
