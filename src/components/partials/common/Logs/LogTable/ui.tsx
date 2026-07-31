import { useState, useMemo, RefObject } from "react";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { PAGE_SIZE } from "@/constants/logic/pagination";
import { mapBatchToSongs } from "@/utils/logs/getSongTable";
import { SongDetailView } from "@/components/partials/modal/SongDetail/ui";
import { CustomPagination } from "@/components/partials/common/ListControls/Pagination/ui";
import { AdvancedFilterModal } from "@/components/partials/common/Songs/AdvancedFilter/ui";
import { SongFilterBar } from "@/components/partials/common/Songs/Filter/ui";
import { SongList } from "@/components/partials/common/Table/ui";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import type { SongWithScore } from "@/types/songs/score";

export const BatchSongsTable = ({
  songs,
  listRef,
}: {
  songs: BatchDetailItem[];
  listRef?: RefObject<HTMLDivElement | null>;
}) => {
  const mappedSongs = useMemo(() => mapBatchToSongs(songs), [songs]);

  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(mappedSongs);

  return (
    <div className="flex w-full flex-col gap-4">
      <SongFilterBar
        disableVersionSelect
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
      />

      <div className="min-h-100">
        <SongList
          songs={visibleSongs}
          onSongSelect={(song) => {
            setSelectedSong(song);
            setIsDetailOpen(true);
          }}
          listRef={listRef}
        />
      </div>

      {isDetailOpen && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      <AdvancedFilterModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        params={params}
        onParamsChange={updateParams}
      />

      <div className="mt-4 flex justify-center pb-8">
        <CustomPagination
          count={totalCount}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
