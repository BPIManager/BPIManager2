import { NoDataAlert } from "@/components/partials/DashBoard/NoData";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { SongDetailView } from "@/components/partials/Modal/BPIChart/SongDetails/ui";
import { CustomPagination } from "@/components/partials/Pagination/ui";
import { AdvancedFilterModal } from "@/components/partials/Songs/AdvancedFilter/ui";
import { SongFilterBar } from "@/components/partials/Songs/Filter/ui";
import { SongListSkeleton } from "@/components/partials/Table/skeleton";
import { useUser } from "@/contexts/users/UserContext";
import {
  useRivalBothScores,
  SongWithRival,
} from "@/hooks/social/useRivalAllScores";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { SongWithScore } from "@/types/songs/withScore";
import {
  useDisclosure,
  Center,
  HStack,
  Container,
  Text,
  Box,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { RivalSongItem } from "./ui";

export const RivalSongsTable = ({
  myUserId,
  rivalUserId,
  rivalName,
  version,
}: {
  myUserId: string | undefined;
  rivalUserId: string | undefined;
  rivalName?: string;
  version?: string;
}) => {
  const { fbUser } = useUser();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { songs, error, isLoading } = useRivalBothScores(
    myUserId,
    rivalUserId,
    version,
  );

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs as SongWithScore[] | undefined);

  const {
    open: isAdvancedOpen,
    onOpen: onOpenAdvanced,
    onClose: onCloseAdvanced,
  } = useDisclosure();

  if (!fbUser) {
    return <LoginRequiredCard />;
  }

  if (!isLoading && (error || !songs)) {
    return (
      <Center h="200px" flexDirection="column">
        <Text color="red.500" fontWeight="bold">
          楽曲データの取得に失敗しました
        </Text>
        <Text fontSize="xs" color="gray.500">
          {error?.message}
        </Text>
      </Center>
    );
  }

  const rivalSongMap = useMemo(() => {
    if (!songs) return new Map<string, SongWithRival>();
    const map = new Map<string, SongWithRival>();
    for (const s of songs) {
      map.set(`${s.songId}-${s.difficulty}`, s as SongWithRival);
    }
    return map;
  }, [songs]);
  return (
    <Container maxW="full" p={0} minH="100svh">
      <SongFilterBar
        withRivals
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={onOpenAdvanced}
      />

      {!isLoading && songs && songs.length === 0 && <NoDataAlert />}

      {isLoading ? (
        <SongListSkeleton />
      ) : (
        <Box w="full" p={2}>
          {visibleSongs.map((song) => {
            const rivalSong = rivalSongMap.get(
              `${song.songId}-${song.difficulty}`,
            );
            return (
              <RivalSongItem
                key={`${song.songId}-${song.difficulty}`}
                song={rivalSong ?? (song as SongWithRival)}
                onClick={() => {
                  setSelectedSong(song);
                  setIsDetailOpen(true);
                }}
              />
            );
          })}
        </Box>
      )}

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
    </Container>
  );
};
