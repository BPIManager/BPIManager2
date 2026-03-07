import { ArenaAverageData } from "@/hooks/metrics/useArenaAverage";
import { Table, Box, Text, VStack, HStack } from "@chakra-ui/react";
import { useState, useMemo, memo } from "react";
import { CustomPagination } from "../../Pagination/ui";

const RANKS = ["A1", "A2", "A3", "A4", "A5"];

export const RANK_THRESHOLDS = [
  { label: "MAX-", ratio: 17 / 18, color: "orange.500", textColor: "gray.900" },
  { label: "AAA", ratio: 8 / 9, color: "yellow.400", textColor: "black" },
  { label: "AA", ratio: 7 / 9, color: "green.400", textColor: "gray.800" },
  { label: "A", ratio: 6 / 9, color: "blue.400", textColor: "gray.800" },
  { label: "B", ratio: 5 / 9, color: "gray.400", textColor: "black" },
  { label: "C", ratio: 4 / 9, color: "gray.400", textColor: "black" },
  { label: "D", ratio: 3 / 9, color: "gray.400", textColor: "black" },
  { label: "E", ratio: 2 / 9, color: "gray.400", textColor: "black" },
  { label: "F", ratio: 0, color: "gray.400", textColor: "black" },
] as const;

type SortKey = "title" | (typeof RANKS)[number];
type SortOrder = "asc" | "desc";

export const getRankInfo = (rate: number) => {
  const ratio = rate / 100;

  const rank = RANK_THRESHOLDS.find((t) => ratio >= t.ratio);

  return rank || RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
};

export const ArenaAverageTable = ({ data }: { data: ArenaAverageData[] }) => {
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortKey === "title") {
        valA = a.title;
        valB = b.title;
      } else {
        valA = a.averages[sortKey]?.rate ?? -1;
        valB = b.averages[sortKey]?.rate ?? -1;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortKey, sortOrder]);

  const visibleData = useMemo(() => {
    return sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [sortedData, page]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k)
      return (
        <Text color="gray.600" fontSize="10px">
          ↕
        </Text>
      );
    return (
      <Text color="blue.400" fontSize="10px">
        {sortOrder === "asc" ? "▲" : "▼"}
      </Text>
    );
  };

  const ArenaRow = memo(({ item }: { item: ArenaAverageData }) => (
    <Table.Row>
      <Table.Cell data-sticky="start" p={2}>
        <Box>
          <Text fontWeight="bold" fontSize="xs" truncate maxW="250px">
            {item.title}
          </Text>
          <Text fontSize="10px" color="fg.muted">
            {item.difficulty}
          </Text>
        </Box>
      </Table.Cell>
      {RANKS.map((rankName) => {
        const stats = item.averages[rankName];
        if (!stats)
          return (
            <Table.Cell key={rankName} textAlign="center">
              -
            </Table.Cell>
          );
        const rankInfo = getRankInfo(stats.rate);
        return (
          <Table.Cell
            key={rankName}
            textAlign="center"
            bg={rankInfo.color}
            color={rankInfo.textColor}
            px={1}
            py={2}
          >
            <VStack gap={0}>
              <Text fontSize="xs" fontWeight="bold">
                {Math.round(stats.avgExScore)}
              </Text>
              <Text fontSize="10px" opacity={0.7}>
                {stats.rate.toFixed(1)}%
              </Text>
            </VStack>
          </Table.Cell>
        );
      })}
    </Table.Row>
  ));

  return (
    <VStack w="full" maxW="full">
      <Table.ScrollArea borderWidth="1px" rounded="md" w="full" maxW="full">
        <Table.Root
          size="sm"
          striped
          stickyHeader
          css={{
            "& [data-sticky]": {
              position: "sticky",
              zIndex: 1,
              bg: "bg",
              _after: {
                content: '""',
                position: "absolute",
                top: "0",
                bottom: "-1px",
                width: "1px",
                bg: "border",
                insetInlineEnd: "0",
              },
            },
            "& [data-sticky=start]": {
              left: "0",
              shadow: "2px 0 4px rgba(0,0,0,0.05)",
            },
            "& thead tr": { zIndex: 2 },
          }}
        >
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader
                data-sticky="start"
                minW="200px"
                p={2}
                cursor="pointer"
                onClick={() => handleSort("title")}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <HStack gap={2}>
                  <Text>楽曲名</Text>
                  <SortIcon k="title" />
                </HStack>
              </Table.ColumnHeader>
              {RANKS.map((rank) => (
                <Table.ColumnHeader
                  key={rank}
                  textAlign="center"
                  minW="80px"
                  p={2}
                  cursor="pointer"
                  onClick={() => handleSort(rank)}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  <VStack gap={0}>
                    <Text>{rank}</Text>
                    <SortIcon k={rank} />
                  </VStack>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {visibleData.map((item) => (
              <ArenaRow key={`${item.title}-${item.difficulty}`} item={item} />
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <CustomPagination
        count={sortedData.length}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        isSticky={true}
      />
    </VStack>
  );
};
