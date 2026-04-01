import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";

import type { RivalSummaryResult } from "@/types/social/rival";

interface RivalSummaryResponse {
  rivals: RivalSummaryResult[];
  viewerBpi: number;
}

/**
 * フォロー中ライバルのサマリー（勝敗・レーダー）を取得する。
 *
 * @param params.userId - 自分のユーザー ID（false の場合はローディング扱い）
 * @param params.levels - フィルタリングするレベル配列
 * @param params.difficulties - フィルタリングする難易度配列
 * @param params.version - IIDX バージョン文字列
 * @returns ライバルサマリー配列・閲覧者BPI・ローディング状態・エラー・更新関数
 */
export const useRivalSummary = (params: {
  userId?: string | boolean;
  levels: string[];
  difficulties: string[];
  version: string;
}) => {
  const { userId, levels, difficulties, version } = params;
  const { fbUser } = useUser();
  const query = new URLSearchParams({ version });
  levels.forEach((l) => query.append("levels", l));
  difficulties.forEach((d) => query.append("difficulties", d));

  const url = userId
    ? `${API_PREFIX}/users/${userId}/rivals/following/summary?${query.toString()}`
    : null;

  const {
    data,
    error,
    isLoading: swrLoading,
    mutate,
  } = useSWR<RivalSummaryResponse>(url ? [url, fbUser] : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const isLoading =
    swrLoading || (userId !== false && !data && !error) || userId === false;
  return {
    rivals: data?.rivals || [],
    viewerBpi: data?.viewerBpi ?? -15,
    isLoading,
    isError: error,
    mutate,
  };
};
