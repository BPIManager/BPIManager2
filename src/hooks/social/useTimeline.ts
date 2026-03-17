import { useUser } from "@/contexts/users/UserContext";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

export interface TimelineEntry {
  logId: number;
  userId: string;
  userName: string;
  profileImage: string | null;
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  lastPlayed: string;
  wrScore: number;
  kaidenAvg: number;
  isOvertaken: boolean;
  opponentScore: {
    currentEx: number;
    prevEx: number | null;
    diffEx: number | null;
    currentBpi: number;
    prevBpi: number | null;
    diffBpi: number | null;
  };
  viewerScore: {
    exScore: number;
    bpi: number;
    clearState: string | null;
    diffFromOpponentEx: number;
    diffFromOpponentBpi: number;
  } | null;
}

interface TimelineResponse {
  timeline: TimelineEntry[];
  nextId: string | null;
}

export const useTimeline = (
  mode: "all" | "played" | "overtaken",
  params: FilterParamsFrontend,
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
  } = useInfiniteList<TimelineResponse, TimelineEntry>(
    (pageIndex, previousPageData: TimelineResponse | null) => {
      if (!fbUser) return null;
      if (previousPageData && !previousPageData.nextId) return null;

      const query = new URLSearchParams();
      query.append("mode", mode);
      if (params.search) query.append("search", params.search);
      if (params.levels?.length) {
        params.levels.forEach((lv) => query.append("levels[]", lv.toString()));
      }
      if (params.difficulties?.length) {
        params.difficulties.forEach((df) => query.append("difficulties[]", df));
      }
      if (pageIndex > 0 && previousPageData?.nextId) {
        query.append("lastId", previousPageData.nextId);
      }

      return [
        `${API_PREFIX}/users/${fbUser.uid}/timeline?${query.toString()}`,
        fbUser,
      ];
    },
    {
      getItems: (page) => page.timeline,
      isLastPage: (page) => page?.nextId === null,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      keepPreviousData: false,
    },
  );

  return {
    timeline: items,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    isError,
    size,
    setSize,
  };
};
