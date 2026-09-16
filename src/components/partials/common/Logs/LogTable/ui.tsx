import { useMemo, useState, RefObject } from "react";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { useCompareScores } from "@/hooks/table/useCompareScores";
import { useMergedCompareSongs } from "@/hooks/table/useMergedCompareSongs";
import { PAGE_SIZE } from "@/constants/logic/pagination";
import { mapBatchToSongs } from "@/utils/logs/getSongTable";
import SongDetailView from "@/components/partials/modal/SongDetail/ui";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import SongList from "@/components/partials/common/Table/ui";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import type { SongWithScore } from "@/types/songs/score";

const BatchSongsTable = ({
  songs,
  userId,
  version,
  listRef,
  onScoreSaved,
}: {
  songs: BatchDetailItem[];
  userId?: string;
  version?: string;
  listRef?: RefObject<HTMLDivElement | null>;
  /** モーダル上でのEXスコア手動保存が成功した際に呼ばれる */
  onScoreSaved?: () => void;
}) => {
  const mappedSongs = useMemo(() => mapBatchToSongs(songs), [songs]);

  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // デフォルトの比較対象は「比較しない」
  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(mappedSongs);

  const { compareData } = useCompareScores(
    userId,
    version,
    params.compareVersion,
  );
  const { mergedVisible } = useMergedCompareSongs(
    mappedSongs,
    visibleSongs,
    compareData,
    params.compareVersion,
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <SongFilterBar
        disableVersionSelect
        withSelfCompare
        currentVersion={version}
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
      />

      <div className="min-h-100">
        <SongList
          songs={mergedVisible}
          compareVersion={params.compareVersion}
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
          userId={userId}
          version={version}
          songDomain="bpi"
          onSaved={onScoreSaved}
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

export default BatchSongsTable;
