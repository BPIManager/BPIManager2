import {
  Container,
  Center,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { SongWithScore } from "@/types/songs/withScore";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { SongFilterBar } from "../Songs/Filter/ui";
import { SongList } from "./table";
import { CustomPagination } from "../Pagination/ui";
import { SongDetailView } from "../Modal/BPIChart/SongDetails/ui";
import { useUserScores } from "@/hooks/table/useUserScores";
import { NoDataAlert } from "../DashBoard/NoData";
import { SongListSkeleton } from "./skeleton";
import { AdvancedFilterModal } from "../Songs/AdvancedFilter/ui";

export const SongsTable = ({
  userId,
  version,
}: {
  userId: string | undefined;
  version?: string;
}) => {
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { songs, error, isLoading } = useUserScores(userId, version);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs);

  const {
    open: isAdvancedOpen,
    onOpen: onOpenAdvanced,
    onClose: onCloseAdvanced,
  } = useDisclosure();

  if (!isLoading && (error || !songs))
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

  return (
    <Container maxW="full" p={0} minH="100svh">
      <SongFilterBar
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={onOpenAdvanced}
      />
      {!isLoading && songs && songs.length === 0 && <NoDataAlert />}

      {isLoading ? (
        <SongListSkeleton />
      ) : (
        <SongList
          songs={visibleSongs}
          onSongSelect={(song) => {
            setSelectedSong(song);
            setIsDetailOpen(true);
          }}
        />
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
