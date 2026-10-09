"use client";

import { useMemo, useState } from "react";
import SongListSkeleton from "@/components/partials/common/Table/skeleton";
import SongList from "@/components/partials/common/Table/ui";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import SongDetailView from "@/components/partials/modal/SongDetail";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { useTopRankers } from "@/hooks/topRankers/useTopRankers";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { ALL_DIFFICULTIES, ALL_LEVELS } from "@/constants/iidx/songLevels";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { SongWithScore } from "@/types/songs/score";

const TopRankersList = ({
  userId,
  version,
  areaId,
}: {
  userId: string;
  version: string;
  /** 表示するエリア（eagateのpref_id）。APIは全エリア分を返すため、ここで絞る */
  areaId: number;
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SongWithScore | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const {
    songs: allAreaSongs,
    error,
    isLoading,
  } = useTopRankers(userId, version);
  const songs = useMemo(
    () => allAreaSongs?.filter((s) => s.areaId === areaId),
    [allAreaSongs, areaId],
  );

  const {
    params,
    updateParams,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    visibleSongs,
  } = useSongFilter(songs, {
    levels: ALL_LEVELS,
    difficulties: ALL_DIFFICULTIES,
    sortKey: "level",
  });

  if (!isLoading && (error || !songs)) {
    return <FetchErrorState error={error} />;
  }

  return (
    <div className="flex w-full flex-col p-0">
      <SongFilterBar
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
        disableVersionSelect
        currentVersion={version}
        levelItems={ALL_LEVELS}
        difficultyItems={ALL_DIFFICULTIES}
      />

      {!isLoading && songs && songs.length === 0 && (
        <p className="p-6 text-center text-sm text-bpim-muted">
          {t("topRankers.list.empty")}
        </p>
      )}

      <main className="flex-1">
        {isLoading ? (
          <SongListSkeleton />
        ) : (
          <SongList songs={visibleSongs} onSongSelect={setSelected} />
        )}
      </main>

      <AdvancedFilterModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        params={params}
        onParamsChange={updateParams}
      />

      {selected && (
        <SongDetailView
          song={selected}
          isOpen
          onClose={() => setSelected(null)}
          userId={userId}
          version={version}
          songDomain="allSongs"
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

export default TopRankersList;
