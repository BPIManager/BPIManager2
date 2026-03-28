import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { AllScoreFilterParams, AllSongWithScore } from "@/types/songs/allSongs";

/**
 * 全バージョンのスコア一覧を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param params - フィルタリングパラメータ（省略時は全件取得）
 * @returns 楽曲スコア配列・ローディング状態・エラー・更新関数
 */
export const useAllScores = (
  userId: string | undefined,
  params?: AllScoreFilterParams,
) => {
  const { fbUser } = useUser();

  const queryString = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) =>
            Array.isArray(v) ? [k, v.join(",")] : [k, String(v)],
          ),
      ).toString()
    : "";

  const { data, error, isLoading, mutate } = useSWR<AllSongWithScore[]>(
    userId
      ? [`${API_PREFIX}/users/${userId}/all-scores/list?${queryString}`, fbUser]
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  return { songs: data, error, isLoading, refresh: mutate };
};
