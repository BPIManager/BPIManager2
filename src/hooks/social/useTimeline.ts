import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { FilterParamsFrontend } from "@/types/songs/withScore";

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

  const getKey = (
    pageIndex: number,
    previousPageData: TimelineResponse | null,
  ) => {
    if (!fbUser) return null;

    if (previousPageData && !previousPageData.nextId) return null;

    const query = new URLSearchParams();
    query.append("mode", mode);

    if (params.search) {
      query.append("search", params.search);
    }
    if (params.levels && params.levels.length > 0) {
      params.levels.forEach((lv) => query.append("levels[]", lv.toString()));
    }
    if (params.difficulties && params.difficulties.length > 0) {
      params.difficulties.forEach((df) => query.append("difficulties[]", df));
    }

    if (pageIndex > 0 && previousPageData?.nextId) {
      query.append("lastId", previousPageData.nextId);
    }

    return `/api/${fbUser.uid}/timeline?${query.toString()}`;
  };

  const { data, size, setSize, error, isLoading, isValidating } =
    useSWRInfinite<TimelineResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  const timeline = data ? data.flatMap((page) => page.timeline) : [];

  const isFetchingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  const isReachingEnd = data ? data[data.length - 1]?.nextId === null : false;

  const loading = isLoading || isFetchingMore;
  return {
    timeline,
    isLoading: loading,
    isValidating,
    isReachingEnd,
    size,
    setSize,
    error,
  };
};
