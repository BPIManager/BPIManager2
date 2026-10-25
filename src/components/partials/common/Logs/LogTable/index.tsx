import { useMemo, useState, RefObject } from "react";
import { useRouter } from "next/router";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { useCompareScores } from "@/hooks/table/useCompareScores";
import { useMergedCompareSongs } from "@/hooks/table/useMergedCompareSongs";
import { PAGE_SIZE } from "@/constants/logic/pagination";
import { mapBatchToSongs } from "@/utils/logs/getSongTable";
import { getPriorSelfBest } from "@/utils/logs/getSelfBestCompare";
import { SELF_BEST_COMPARE } from "@/constants/logic/compareTarget";
import SongDetailView from "@/components/partials/modal/SongDetail";
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

  // 比較差でのフィルタはページング前に行う必要があるため、比較先はURLから直接読む
  const { query } = useRouter();
  const compareVersion =
    typeof query.compareVersion === "string" ? query.compareVersion : undefined;
  const compareResult = query.compareResult;

  const { compareData: versionCompareData } = useCompareScores(
    userId,
    version,
    compareVersion,
  );
  const compareData = useMemo(
    () =>
      compareVersion === SELF_BEST_COMPARE
        ? mappedSongs.map((m, i) => ({
            ...m,
            rival: getPriorSelfBest(songs[i]),
          }))
        : versionCompareData,
    [compareVersion, songs, mappedSongs, versionCompareData],
  );
  const { mergedSongs } = useMergedCompareSongs(
    mappedSongs,
    [],
    compareData,
    compareVersion,
  );

  // 比較データ取得前は差分が未確定のためフィルタしない
  const comparedSongs = useMemo(() => {
    if (!compareData || (compareResult !== "plus" && compareResult !== "minus"))
      return mergedSongs;
    return mergedSongs?.filter((s) =>
      s.exDiff === undefined
        ? false
        : compareResult === "plus"
          ? s.exDiff > 0
          : s.exDiff < 0,
    );
  }, [mergedSongs, compareData, compareResult]);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(comparedSongs);

  return (
    <div className="flex w-full flex-col gap-4">
      <SongFilterBar
        disableVersionSelect
        withSelfCompare
        withSelfBestCompare
        withCompareResultFilter
        currentVersion={version}
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
      />

      <div className="min-h-100">
        <SongList
          songs={visibleSongs}
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
