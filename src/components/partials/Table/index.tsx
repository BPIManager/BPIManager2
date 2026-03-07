import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Container,
  Input,
  HStack,
  Spinner,
  Center,
  Text,
  VStack,
  Pagination,
  ButtonGroup,
  IconButton,
} from "@chakra-ui/react";
import {
  LuSearch,
  LuFilter,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import useSWR from "swr";
import { FilterParams, SongWithScore } from "@/types/songs/withScore";
import { filterSongs } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { SongList } from "./table";
import { sortOptions } from "@/constants/sort";
import { FormSelect } from "@/components/ui/select";
import { InputGroup } from "@/components/ui/input-group";
import { latestVersion } from "@/constants/latestVersion";
import { CustomPagination } from "../Pagination/ui";

export const PAGE_SIZE = 20;
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SongsTableProps {
  userId: string;
  version?: string;
}

export const SongsTable = ({ userId }: SongsTableProps) => {
  const [params, setParams] = useState<FilterParams>({
    search: "",
    sortKey: "bpi",
    sortOrder: "desc",
  });
  const [page, setPage] = useState(1);

  const { data, error, isLoading } = useSWR<SongWithScore[]>(
    `/api/${userId}/scores/${latestVersion}/latest`,
    fetcher,
  );
  const displaySongs = useMemo(() => {
    if (!data || error) return [];
    const filtered = filterSongs(data, params);
    return sortSongs(filtered, params);
  }, [data, params]);

  useEffect(() => {
    setPage(1);
  }, [params]);

  const visibleSongs = useMemo(() => {
    const startRange = (page - 1) * PAGE_SIZE;
    const endRange = startRange + PAGE_SIZE;
    return displaySongs.slice(startRange, endRange);
  }, [displaySongs, page]);

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="200px" flexDirection="column">
        <Text color="red.500">データの取得に失敗しました</Text>
        <Text fontSize="xs">{error?.message}</Text>
      </Center>
    );
  }

  return (
    <Container maxW="full" p={0} minH="100vh">
      <Box p={4} borderBottomWidth="1px">
        <VStack gap={3} align="stretch">
          <HStack w="full">
            <InputGroup w="full" startElement={<LuSearch />}>
              <Input
                px={2}
                placeholder="曲名で検索..."
                variant="subtle"
                fontSize="sm"
                value={params.search}
                onChange={(e) =>
                  setParams({ ...params, search: e.target.value })
                }
              />
            </InputGroup>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="bold" color="gray.400">
              {displaySongs.length} TRACKS FOUND
            </Text>
            <VStack gap={1} alignItems={"end"}>
              <Text fontSize="10px" color="gray.500" fontWeight="bold">
                SORT
              </Text>
              <FormSelect
                width={"180px"}
                collection={sortOptions}
                value={params.sortKey || "bpi"}
                onValueChange={(details) =>
                  setParams({ ...params, sortKey: details as any })
                }
                placeholder="未設定"
              />
            </VStack>
          </HStack>
        </VStack>
      </Box>

      <SongList songs={visibleSongs} />
      <CustomPagination
        count={displaySongs.length}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
      />
    </Container>
  );
};
