"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SongWithScore } from "@/types/songs/score";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { useMergedCompareSongs } from "@/hooks/table/useMergedCompareSongs";
import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import SongList from "./ui";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import SongDetailView from "@/components/partials/modal/SongDetail";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useUnplayedScores } from "@/hooks/table/useUnplayedScores";
import { useCompareScores } from "@/hooks/table/useCompareScores";
import { NoDataAlert } from "@/components/partials/common/DashBoard/NoData";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import SongListSkeleton from "./skeleton";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useUser } from "@/contexts/users/UserContext";
import { useProfile } from "@/hooks/users/useProfile";

const SongsTable = ({
  userId,
  version,
}: {
  userId: string | undefined;
  version?: string;
}) => {
  const { t } = useTranslation();
  const { fbUser } = useUser();
  const { profile } = useProfile(userId);
  const isOtherUser = !!userId && !!fbUser && userId !== fbUser.uid;
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const {
    songs: playedSongs,
    error,
    isLoading: playedLoading,
    currentVersion,
    refresh,
  } = useUserScores(userId, version);

  // プレイ状態が「未プレイ」「すべて」のときだけ、未プレイ曲（EX・BPIなし）も取得して一覧に加える
  const { query, isReady } = useRouter();
  const includeUnplayed =
    isReady && (query.isMyPlayed === "false" || query.isMyPlayed === "any");
  const {
    songs: unplayedSongs,
    error: unplayedError,
    isLoading: unplayedLoading,
    refresh: refreshUnplayed,
  } = useUnplayedScores(includeUnplayed ? userId : undefined, version);

  const songs = useMemo(
    () =>
      playedSongs && includeUnplayed
        ? [...playedSongs, ...(unplayedSongs ?? [])]
        : playedSongs,
    [playedSongs, unplayedSongs, includeUnplayed],
  );
  const isLoading = playedLoading || (includeUnplayed && unplayedLoading);

  const {
    params,
    updateParams,
    page,
    setPage,
    pageSize,
    totalCount,
    visibleSongs: rawVisible,
  } = useSongFilter(songs, { isMyPlayed: true });

  const { compareData, compareError, isCompareLoading } = useCompareScores(
    userId,
    currentVersion,
    params.compareVersion,
  );

  const { mergedVisible } = useMergedCompareSongs(
    songs,
    rawVisible,
    compareData,
    params.compareVersion,
  );

  if (!isLoading && (error || (includeUnplayed && unplayedError) || !songs)) {
    return <FetchErrorState error={error ?? unplayedError} />;
  }

  const showCompareLoading =
    isCompareLoading &&
    params.compareVersion &&
    params.compareVersion !== "none";
  const showCompareError =
    !isCompareLoading &&
    compareError &&
    params.compareVersion &&
    params.compareVersion !== "none";

  return (
    <div className="flex w-full min-h-svh flex-col p-0">
      <SongFilterBar
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
        withSelfCompare
        withScoreRate
        withPlayStateFilter
        currentVersion={currentVersion}
      />

      {!isLoading && songs && songs.length === 0 && (
        <div className="p-4">
          <NoDataAlert />
        </div>
      )}

      {showCompareLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-bpim-muted border-b border-bpim-border">
          <LoadingSpinner size="xs" />
          {t("table.loadingPrevVersion")}
        </div>
      )}

      {showCompareError && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-bpim-danger border-b border-bpim-border">
          {t("common.error.fetchFailed")}
        </div>
      )}

      <main className="flex-1">
        {isLoading ? (
          <SongListSkeleton />
        ) : (
          <SongList
            songs={mergedVisible}
            compareVersion={params.compareVersion}
            onSongSelect={(song) => {
              setSelectedSong(song);
              setIsDetailOpen(true);
            }}
          />
        )}
      </main>

      <AdvancedFilterModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        params={params}
        onParamsChange={updateParams}
        withPlayState
      />

      {isDetailOpen && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          userId={userId}
          version={currentVersion}
          songDomain="bpi"
          onSaved={() => {
            void refresh();
            if (includeUnplayed) void refreshUnplayed();
          }}
          subjectUser={
            isOtherUser
              ? { userId, userName: profile?.userName ?? "" }
              : undefined
          }
          scoreOwnerId={userId}
        />
      )}

      <CustomPagination
        count={totalCount}
        pageSize={pageSize}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
};

export default SongsTable;
