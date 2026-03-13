import { SimpleGrid, VStack, Text, Center } from "@chakra-ui/react";
import { RivalSummaryResult } from "@/hooks/social/useRivalSummary";
import { RivalSummaryCard } from "./ui";
import { RivalSummarySkeleton } from "./skeleton";
import { RivalWinLossSummaryNotFound } from "../../DashBoard/Rivals/nodata";

interface RivalListProps {
  results: RivalSummaryResult[];
  isLoading: boolean;
  isError: boolean;
  onCardClick: (userId: string) => void;
}

export const RivalList = ({
  results,
  isLoading,
  isError,
  onCardClick,
}: RivalListProps) => {
  if (isError) {
    return (
      <Center py={20}>
        <Text color="red.400">データの取得に失敗しました。</Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4} w="full">
        {Array.from({ length: 6 }).map((_, i) => (
          <RivalSummarySkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  if (!isLoading && results.length === 0) {
    return <RivalWinLossSummaryNotFound />;
  }

  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4} w="full">
      {results.map((rival) => (
        <RivalSummaryCard
          key={rival.userId}
          rival={rival}
          onClick={() => onCardClick(rival.userId)}
        />
      ))}
    </SimpleGrid>
  );
};
