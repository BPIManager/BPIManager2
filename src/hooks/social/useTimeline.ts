import { useUser } from "@/contexts/users/UserContext";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

/** タイムラインの1エントリ */
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
  /** WR スコア */
  wrScore: number;
  /** 皆伝平均 */
  kaidenAvg: number;
  /** 閲覧者が抜かれているか */
  isOvertaken: boolean;
  /** ライバルのスコア変化情報 */
  opponentScore: {
    currentEx: number;
    prevEx: number | null;
    diffEx: number | null;
    currentBpi: number;
    prevBpi: number | null;
    diffBpi: number | null;
  };
  /** 閲覧者のスコアとライバルとの差分（未プレイの場合 null） */
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

/**
 * フォロー中ライバルのアクティビティタイムラインを無限スクロールで取得する。
 *
 * @param mode - 表示モード。`"all"` 全件、`"played"` 閲覧者もプレイ済み、`"overtaken"` 抜かれた楽曲
 * @param params - レベル・難易度・検索キーワードなどのフィルター条件
 * @returns タイムライン配列・ローディング状態・ページング操作
 */
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
