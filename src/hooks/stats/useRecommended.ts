import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";
import { SongWithScore } from "@/types/songs/withScore";

const PAGE_SIZE = 20;

export interface RecommendedItem extends SongWithScore {
  current: {
    exScore: number | null;
    bpi: number | null;
    clearState: string | null;
  };
  diff: { exScore: number; bpi: number };
  exDiff: number;
  bpiDiff: number;
}

interface RecommendedPage {
  weapons: { data: RecommendedItem[]; total: number };
  potential: { data: RecommendedItem[]; total: number };
}

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
