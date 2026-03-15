import { Box, VStack, Text, Button } from "@chakra-ui/react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { RivalComparisonRow } from "./row";
import { RivalWinLossSummarySkeleton } from "./skeleton";
import { RivalWinLossSummaryNotFound } from "./nodata";
import { DashCard } from "@/components/ui/dashcard";

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

  const displayCount = 5;
  const hasMore = results.length > displayCount;
  const visibleItems = showAll ? results : results.slice(0, displayCount);

  return (
    <DashCard>
      <Text fontSize="sm" fontWeight="bold" mb={4} color="gray.400">
        ライバル勝敗
      </Text>

      {isLoading ? (
        <RivalWinLossSummarySkeleton />
      ) : results.length === 0 ? (
        <RivalWinLossSummaryNotFound />
      ) : (
        <VStack gap={4} align="stretch">
          {visibleItems.map((rival) => (
            <RivalComparisonRow key={rival.userId} rival={rival} />
          ))}
        </VStack>
      )}

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
    </DashCard>
  );
};
