import useSWR from "swr";
import { SongWithScore } from "@/types/songs/score";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";

/**
 * 指定ユーザーの全楽曲スコア一覧を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param version - IIDX バージョン（省略時は最新バージョン）
 * @returns 楽曲スコア配列・ローディング状態・エラー・更新関数・取得バージョン
 */
export const useUserScores = (userId: string | undefined, version?: string) => {
  const targetVersion = version || latestVersion;
  const { fbUser } = useUser();

  const { data, error, isLoading, mutate } = useSWR<SongWithScore[]>(
    userId
      ? [
          `${API_PREFIX}/users/${userId}/scores?version=${targetVersion}&asOf=latest`,
          fbUser,
        ]
      : null,
    fetcher,
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
