import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { RadarSummaryData } from "@/types/stats/radar";
import { API_PREFIX } from "@/constants/apiEndpoints";

/** ライバルとの勝敗集計 */
export interface RivalStats {
  /** 勝ち曲数 */
  win: number;
  /** 負け曲数 */
  lose: number;
  /** 引き分け曲数 */
  draw: number;
  /** 比較対象曲数合計 */
  totalCount: number;
}

/** ライバルサマリーの1件分 */
export interface RivalSummaryResult {
  userId: string;
  userName: string;
  profileImage: string | null;
  iidxId: string | null;
  arenaRank: string | null;
  totalBpi: number | null;
  /** ライバルのレーダーチャートデータ */
  radar: RadarSummaryData;
  /** 閲覧者のレーダーチャートデータ */
  viewerRadar: RadarSummaryData;
  stats: RivalStats;
}

/**
 * フォロー中ライバルのサマリー（勝敗・レーダー）を取得する。
 *
 * @param params.userId - 自分のユーザー ID（false の場合はローディング扱い）
 * @param params.levels - フィルタリングするレベル配列
 * @param params.difficulties - フィルタリングする難易度配列
 * @param params.version - IIDX バージョン文字列
 * @returns ライバルサマリー配列・ローディング状態・エラー・更新関数
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
  } = useSWR<RivalSummaryResult[]>(url ? [url, fbUser] : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const isLoading =
    swrLoading || (userId !== false && !data && !error) || userId === false;
  return {
    results: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};
