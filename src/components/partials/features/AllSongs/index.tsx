"use client";

import { useState } from "react";
import SongListSkeleton from "@/components/partials/common/Table/skeleton";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import { SongWithScore } from "@/types/songs/score";
import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import { AllSongList } from "./Table";
import SongDetailView from "@/components/partials/modal/SongDetail/ui";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { useAllScores } from "@/hooks/allScores/useAllScores";
import { useAllScoresCompare } from "@/hooks/allScores/useAllScoresCompare";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { useMergedCompareSongs } from "@/hooks/table/useMergedCompareSongs";
import { ALL_DIFFICULTIES, ALL_LEVELS } from "@/constants/iidx/songLevels";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

const AllSongsTable = ({ userId }: { userId: string | undefined }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { songs, error, isLoading } = useAllScores(userId);

  const {
    params,
    updateParams,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    visibleSongs: rawVisible,
  } = useSongFilter(songs, {
    levels: ALL_LEVELS,
    difficulties: ALL_DIFFICULTIES,
    sortKey: "level",
  });

  const { compareData, compareError, isCompareLoading } = useAllScoresCompare(
    userId,
    params.compareVersion,
  );

  const { mergedVisible } = useMergedCompareSongs(
    songs,
    rawVisible,
    compareData,
    params.compareVersion,
  );

  if (!isLoading && error) {
    return <FetchErrorState error={error} />;
  }

  const showCompareLoading =
    isCompareLoading && params.compareVersion && params.compareVersion !== "none";
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
        disableVersionSelect
        withSelfCompare
        excludeCurrentVersionFromCompare={false}
        levelItems={ALL_LEVELS}
        difficultyItems={ALL_DIFFICULTIES}
        excludeSortKeys={["bpi"]}
      />

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
          <AllSongList
            songs={mergedVisible}
            compareVersion={params.compareVersion}
            onSongSelect={(s) => {
              setSelected(s);
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

      {isDetailOpen && selected && (
        <SongDetailView
          song={selected}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      <CustomPagination
        count={totalCount}
        pageSize={pageSize}
        page={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default AllSongsTable;
