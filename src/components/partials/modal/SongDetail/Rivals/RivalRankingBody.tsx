import { useEffect, useMemo, useRef } from "react";
import type { ListImperativeAPI } from "react-window";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { useAllSongRivalScores } from "@/hooks/allScores/useAllSongRivalScores";
import { SectionLoader } from "@/components/ui/loading-spinner";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { buildRivalRankings } from "@/utils/songs/rankingRows";
import { RankingList } from "./ui";
import type { RankingBodyProps } from "./types";

export default function RivalRankingBody({
  version,
  songId,
  myScore,
  song,
  notes,
  onNavigate,
  highlightUserId,
  compareTargets,
}: RankingBodyProps) {
  const { user, fbUser } = useUser();
  const isAllScores = notes != null;
  const includeUserIds = useMemo(() => {
    const ids = [
      highlightUserId,
      ...(compareTargets ?? []).map((tg) => tg.userId),
    ].filter((id): id is string => !!id);
    return fbUser && ids.length > 0 ? [fbUser.uid, ...new Set(ids)] : [];
  }, [highlightUserId, compareTargets, fbUser]);
  const {
    data: mainData,
    isLoading: mainLoading,
    error: mainError,
  } = useRivalScores(isAllScores ? null : songId, version, includeUserIds);
  const {
    data: allData,
    isLoading: allLoading,
    error: allError,
  } = useAllSongRivalScores(isAllScores ? songId : null, version);
  const data = isAllScores ? allData : mainData;
  const isLoading = isAllScores ? allLoading : mainLoading;
  const error = isAllScores ? allError : mainError;
  const listRef = useRef<ListImperativeAPI>(null);

  const rankings = useMemo(
    () =>
      buildRivalRankings({
        rivals: data?.rivals,
        myScore,
        self: {
          uid: fbUser?.uid,
          userName: user?.userName,
          profileImage: user?.profileImage,
        },
        song,
        compareTargets: compareTargets ?? [],
      }),
    [
      data,
      myScore,
      song,
      compareTargets,
      fbUser?.uid,
      user?.userName,
      user?.profileImage,
    ],
  );

  const highlightIndex = highlightUserId
    ? rankings.findIndex((r) => r.userId === highlightUserId)
    : -1;
  useEffect(() => {
    if (highlightIndex < 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToRow({ align: "center", index: highlightIndex });
    }, 50);
    return () => clearTimeout(timer);
  }, [highlightIndex, isLoading]);

  if (isLoading) {
    return <SectionLoader className="py-8" color="text-bpim-info" />;
  }
  if (error) {
    return <FetchErrorState error={error} className="min-h-64" />;
  }

  return (
    <RankingList
      rankings={rankings}
      listRef={listRef}
      onNavigate={onNavigate}
      highlightUserId={highlightUserId}
      notes={notes}
    />
  );
}
