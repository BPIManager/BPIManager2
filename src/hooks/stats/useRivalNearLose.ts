import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { useInfiniteList } from "@/services/swr/useInfinite";
import { SongWithScore, RivalScore } from "@/types/songs/withScore";

/** ライバルにギリギリ負けている楽曲の1件分 */
export interface NearLoseSongItem extends SongWithScore {
  /** 最接近ライバルのスコア情報とユーザー情報 */
  rival: RivalScore & {
    userId: string;
    userName: string;
    profileImage: string | null;
    exScore: number;
  };
  /** ライバルとのEXスコア差分（正値 = ライバルが上） */
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

/**
 * ライバルにギリギリ負けている楽曲を無限スクロールで取得する。
 *
 * @param userId - 対象ユーザー ID
 * @param version - IIDX バージョン文字列
 * @param levels - フィルタリングするレベル配列
 * @param diffs - フィルタリングする難易度配列
 * @param threshold - スコア差分の最小/最大閾値（デフォルト: 1〜100）
 * @returns 楽曲配列・ページング操作・ローディング状態
 */
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
