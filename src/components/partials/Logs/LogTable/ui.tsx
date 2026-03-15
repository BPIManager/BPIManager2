import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { mapBatchToSongs } from "@/utils/logs/getSongTable";
import { Box, useDisclosure } from "@chakra-ui/react";
import { useState, useMemo, RefObject } from "react";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { CustomPagination } from "../../Pagination/ui";
import { AdvancedFilterModal } from "../../Songs/AdvancedFilter/ui";
import { SongFilterBar } from "../../Songs/Filter/ui";
import { SongList } from "../../Table/table";
import { BatchDetailItem } from "@/hooks/batches/useBatchDetail";

export const BatchSongsTable = ({
  songs,
  listRef,
}: {
  songs: BatchDetailItem[];
  listRef?: RefObject<HTMLDivElement | null>;
}) => {
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const mappedSongs = useMemo(() => mapBatchToSongs(songs), [songs]);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(mappedSongs);

  const {
    open: isAdvancedOpen,
    onOpen: onOpenAdvanced,
    onClose: onCloseAdvanced,
  } = useDisclosure();

  return (
    <Box>
      <SongFilterBar
        disableVersionSelect
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={onOpenAdvanced}
      />

      <SongList
        songs={visibleSongs}
        onSongSelect={(song) => {
          setSelectedSong(song);
          setIsDetailOpen(true);
        }}
        listRef={listRef}
      />

      <AdvancedFilterModal
        isOpen={isAdvancedOpen}
        onClose={onCloseAdvanced}
        params={params}
        onParamsChange={updateParams}
      />

      {isDetailOpen && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      <CustomPagination
        count={totalCount}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
      />
    </Box>
  );
};
