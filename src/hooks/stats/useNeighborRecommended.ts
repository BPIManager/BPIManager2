import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";
import type {
  NeighborRecommendedItem,
  NeighborRecommendedPage,
} from "@/types/stats/neighborRecommended";

const PAGE_SIZE = 20;

/**
 * 近傍プレイヤーとの相対比較に基づくおすすめ楽曲を無限スクロールで取得する。
 *
 * @param userId  - 対象ユーザー ID
 * @param version - IIDX バージョン文字列
 * @param levels  - フィルタリングするレベル配列
 * @param diffs   - フィルタリングする難易度配列
 * @param type    - `"weapons"` は近傍より高い楽曲、`"potential"` は近傍より低い楽曲
 * @param n       - 比較に使用する近傍プレイヤー数
 */
export const useNeighborRecommendedInfinite = (
  userId: string,
  version: string,
  levels: string[],
  diffs: string[],
  type: "weapons" | "potential",
  n: number,
) => {
  const { fbUser } = useUser();

  return useInfiniteList<NeighborRecommendedPage, NeighborRecommendedItem>(
    (index) => {
      if (!fbUser || !userId) return null;

      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: (index * PAGE_SIZE).toString(),
        version,
        n: n.toString(),
      });
      levels.forEach((l) => params.append("level", l));
      diffs.forEach((d) => params.append("difficulty", d));

      return [
        `${API_PREFIX}/users/${userId}/stats/neighbor-recommended?${params.toString()}`,
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
};
