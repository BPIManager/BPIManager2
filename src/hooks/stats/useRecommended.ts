import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";
import { SongWithScore } from "@/types/songs/withScore";

const PAGE_SIZE = 20;

/** おすすめ楽曲の1件分（伸びしろ・ポテンシャル情報を含む） */
export interface RecommendedItem extends SongWithScore {
  /** 現在スコア */
  current: {
    exScore: number | null;
    bpi: number | null;
    clearState: string | null;
  };
  /** 前回からの差分 */
  diff: { exScore: number; bpi: number };
  /** EXスコア差分 */
  exDiff: number;
  /** BPI 差分 */
  bpiDiff: number;
}

interface RecommendedPage {
  weapons: { data: RecommendedItem[]; total: number };
  potential: { data: RecommendedItem[]; total: number };
}

/**
 * おすすめ楽曲（武器曲 / ポテンシャル）を無限スクロールで取得する。
 *
 * @param userId - 対象ユーザー ID
 * @param version - IIDX バージョン文字列
 * @param levels - フィルタリングするレベル配列
 * @param diffs - フィルタリングする難易度配列
 * @param type - `"weapons"` は伸び代大の楽曲、`"potential"` はポテンシャルの高い楽曲
 * @returns 楽曲配列・ページング操作・ローディング状態
 */
export const useRecommendedInfinite = (
  userId: string,
  version: string,
  levels: string[],
  diffs: string[],
  type: "weapons" | "potential",
) => {
  const { fbUser } = useUser();

  const {
    items,
    size,
    setSize,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError,
  } = useInfiniteList<RecommendedPage, RecommendedItem>(
    (index) => {
      if (!fbUser || !userId) return null;

      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: (index * PAGE_SIZE).toString(),
        version,
      });
      levels.forEach((l) => params.append("level", l));
      diffs.forEach((d) => params.append("difficulty", d));

      return [
        `${API_PREFIX}/users/${userId}/stats/recommended?${params.toString()}`,
        fbUser,
      ];
    },
    {
      getItems: (page) => page?.[type]?.data ?? [],
      isLastPage: (page) => {
        const section = page?.[type];
        if (!section) return true;
        return section.data.length >= section.total;
      },
      revalidateOnFocus: false,
    },
  );

  return {
    items,
    size,
    setSize,
    isReachingEnd,
    isLoading,
    isLoadingMore,
    isError,
  };
};
