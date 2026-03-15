import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { useInfiniteList } from "@/services/swr/useInfinite";
import { SongWithScore, RivalScore } from "@/types/songs/withScore";

export interface NearLoseSongItem extends SongWithScore {
  rival: RivalScore & {
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
    lastSongId: number;
    lastRivalId: string;
  } | null;
}

export const useNearLoseInfinite = (
  userId: string,
  version: string,
  levels: string[],
  diffs: string[],
  threshold: { min: number; max: number } = { min: 1, max: 100 },
) => {
  const { fbUser } = useUser();
  const PAGE_SIZE = 20;

  const { items, size, setSize, isLoadingMore, isReachingEnd, isError } =
    useInfiniteList<NearLoseResponse, NearLoseSongItem>(
      (pageIndex, previousPageData: NearLoseResponse | null) => {
        if (!userId || !version || !fbUser) return null;
        if (previousPageData && !previousPageData.nextCursor) return null;

        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          minDiff: threshold.min.toString(),
          maxDiff: threshold.max.toString(),
          version,
        });

        levels.forEach((l) => params.append("levels", l));
        diffs.forEach((d) => params.append("difficulties", d));

        if (pageIndex > 0 && previousPageData?.nextCursor) {
          const { lastDiff, lastSongId, lastRivalId } =
            previousPageData.nextCursor;
          params.append("lastDiff", String(lastDiff));
          params.append("lastSongId", String(lastSongId));
          params.append("lastRivalId", lastRivalId);
        }

        return [
          `${API_PREFIX}/users/${userId}/rivals/following/scores?${params.toString()}`,
          fbUser,
        ];
      },
      {
        getItems: (page) => page?.items ?? [],
        isLastPage: (page) => !page?.nextCursor,
        revalidateOnFocus: false,
      },
    );

  return { items, size, setSize, isLoadingMore, isReachingEnd, isError };
};
