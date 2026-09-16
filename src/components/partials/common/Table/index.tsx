"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/score";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { useMergedCompareSongs } from "@/hooks/table/useMergedCompareSongs";
import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import SongList from "./ui";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import SongDetailView from "@/components/partials/modal/SongDetail/ui";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useCompareScores } from "@/hooks/table/useCompareScores";
import { NoDataAlert } from "@/components/partials/common/DashBoard/NoData";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import SongListSkeleton from "./skeleton";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

const SongsTable = ({
  userId,
  version,
}: {
  userId: string | undefined;
  version?: string;
}) => {
  const { t } = useTranslation();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { songs, error, isLoading, currentVersion, refresh } = useUserScores(
    userId,
    version,
  );

  const {
    params,
    updateParams,
    page,
    setPage,
    pageSize,
    totalCount,
    visibleSongs: rawVisible,
  } = useSongFilter(songs);

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

  if (!isLoading && (error || !songs)) {
    return <FetchErrorState error={error} />;
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
      />

      {isDetailOpen && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          userId={userId}
          version={currentVersion}
          songDomain="bpi"
          onSaved={() => refresh()}
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
