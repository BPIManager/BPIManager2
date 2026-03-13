import { SongWithScore } from "@/types/songs/withScore";
import { fetcher } from "@/utils/common/fetch";
import useSWRInfinite from "swr/infinite";

export interface NearLoseSongItem extends SongWithScore {
  rival: {
    userId: string;
    userName: string;
    profileImage: string | null;
    exScore: number;
  };
  exDiff: number;
}

interface NearLoseResponse {
  items: NearLoseSongItem[];
  nextCursor: {
    lastDiff: number;
    lastSongId: string;
    lastRivalId: string;
  } | null;
}

export const useNearLoseInfinite = (
  userId: string,
  version: string,
  levels: string[],
  diffs: string[],
) => {
  const PAGE_SIZE = 20;

  const getKey = (
    pageIndex: number,
    previousPageData: NearLoseResponse | null,
  ) => {
    if (previousPageData && !previousPageData.nextCursor) return null;

    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
    });

    levels.forEach((l) => params.append("levels", l));
    diffs.forEach((d) => params.append("difficulties", d));

    if (pageIndex > 0 && previousPageData?.nextCursor) {
      const { lastDiff, lastSongId, lastRivalId } = previousPageData.nextCursor;
      params.append("lastDiff", String(lastDiff));
      params.append("lastSongId", lastSongId);
      params.append("lastRivalId", lastRivalId);
    }

    const url = `/api/${userId}/rivals/${version}/nearLose?${params.toString()}`;
    return url;
  };

  const { data, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite<NearLoseResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
    });

  const items = data
    ? data.filter(Boolean).flatMap((page) => page.items || [])
    : [];
  const isLoadingMore = isLoading || (isValidating && size > 1);
  const isReachingEnd =
    data && data[data.length - 1] && !data[data.length - 1].nextCursor;

  return { items, size, setSize, isLoadingMore, isReachingEnd, isError: error };
};
