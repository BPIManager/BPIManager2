import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { FilterParamsFrontend, SongWithScore } from "@/types/songs/score";

/**
 * 全バージョンのスコア一覧を取得する。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はフェッチしない）
 * @param params - フィルタリングパラメータ（省略時は全件取得）
 * @returns 楽曲スコア配列・ローディング状態・エラー・更新関数
 */
export const useAllScores = (
  userId: string | undefined,
  params?: Pick<
    FilterParamsFrontend,
    "search" | "levels" | "difficulties" | "clearStates" | "sortKey" | "sortOrder"
  >,
) => {
  const queryString = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) =>
            Array.isArray(v) ? [k, v.join(",")] : [k, String(v)],
          ),
      ).toString()
    : "";

  const { data, error, isLoading, mutate } = useAuthedSWRV2<SongWithScore[]>(
    userId
      ? `${API_V2_PREFIX}/users/${userId}/all-scores/list?${queryString}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  return { songs: data, error, isLoading, refresh: mutate };
};
