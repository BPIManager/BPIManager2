import { Box, VStack, Text, Button } from "@chakra-ui/react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { RivalComparisonRow } from "./row";
import { RivalWinLossSummarySkeleton } from "./skeleton";
import { RivalWinLossSummaryNotFound } from "./nodata";

export const RivalWinLossSummary = ({
  userId,
}: {
  userId?: string | undefined;
}) => {
  const { levels, diffs, version } = useStatsFilter();
  const { results, isLoading } = useRivalSummary({
    userId,
    version,
    levels,
    difficulties: diffs,
  });
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return <RivalWinLossSummarySkeleton />;
  }

  if (results.length === 0) {
    return <RivalWinLossSummaryNotFound />;
  }

  const displayCount = 5;
  const hasMore = results.length > displayCount;
  const visibleItems = showAll ? results : results.slice(0, displayCount);

  return (
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
    >
      <Text fontSize="sm" fontWeight="bold" mb={4} color="gray.400">
        ライバル勝敗
      </Text>

      <VStack gap={4} align="stretch">
        {visibleItems.map((rival) => (
          <RivalComparisonRow key={rival.userId} rival={rival} />
        ))}
      </VStack>

      {hasMore && (
        <Button
          variant="ghost"
          width="full"
          mt={4}
          size="sm"
          color="gray.400"
          onClick={() => setShowAll(!showAll)}
          _hover={{ bg: "whiteAlpha.50", color: "white" }}
        >
          {showAll ? (
            <>
              <ChevronUp size={16} /> 閉じる
            </>
          ) : (
            <>
              <ChevronDown size={16} /> 残り {results.length - displayCount}{" "}
              人を表示
            </>
          )}
        </Button>
      )}
    </Box>
  );
};
