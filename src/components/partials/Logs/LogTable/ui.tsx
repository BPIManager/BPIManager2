import { useState, useMemo, RefObject } from "react";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { mapBatchToSongs } from "@/utils/logs/getSongTable";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { CustomPagination } from "../../Pagination/ui";
import { AdvancedFilterModal } from "../../Songs/AdvancedFilter/ui";
import { SongFilterBar } from "../../Songs/Filter/ui";
import { SongList } from "../../Table/ui";
import type { BatchDetailItem } from "@/types/logs/batchDetail";

export const BatchSongsTable = ({
  songs,
  listRef,
}: {
  songs: BatchDetailItem[];
  listRef?: RefObject<HTMLDivElement | null>;
}) => {
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const mappedSongs = useMemo(() => mapBatchToSongs(songs), [songs]);

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

      <div className="min-h-[400px]">
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
