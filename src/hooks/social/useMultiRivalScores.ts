import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import type { MultiRivalScoreRow } from "@/types/social/rival";

interface CompareScoresResponse {
  scores: MultiRivalScoreRow[];
  rivalIds: string[];
}

/**
 * 自分+選択した複数ライバルの楽曲ごと最新スコアを取得する。
 *
 * 比較ページの複数ライバル(1:N)比較(#287)に使う。`rivalIds`が空配列
 * （追加ライバル未選択、= 従来の1:1表示）の場合はフェッチしない
 * （1:1表示は既存の`useRivalComparison`/`RivalSongsTable`のまま）。
 *
 * @param userId - 自分のユーザー ID（未ログイン時は `false`）
 * @param rivalIds - 追加で比較対象にするライバルのユーザーID配列
 * @param version - IIDX バージョン文字列
 */
export const useMultiRivalScores = (
  userId: string | boolean | undefined,
  rivalIds: string[],
  version: string,
) => {
  const url =
    userId && typeof userId === "string" && rivalIds.length > 0
      ? (() => {
          const query = new URLSearchParams({ version });
          rivalIds.forEach((id) => query.append("rivalIds", id));
          return `${API_PREFIX}/users/${userId}/rivals/compare-scores?${query.toString()}`;
        })()
      : null;

  const { data, error, isLoading } = useAuthedSWR<CompareScoresResponse>(url, {
    revalidateOnFocus: false,
  });

  return {
    scores: data?.scores ?? [],
    resolvedRivalIds: data?.rivalIds ?? [],
    isLoading,
    isError: error,
  };
};
