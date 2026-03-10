import { Box, Text, SimpleGrid, VStack, Badge, HStack } from "@chakra-ui/react";
import { useRadar } from "@/hooks/stats/useRadar";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { RadarSkeleton } from "./skeleton";
import { RadarSectionChart } from "./ui";
import { RadarCategory } from "@/types/stats/radar";
import { getBpiColorStyle } from "../BPIDistribution";
import { useMemo, useState } from "react";
import { RadarCategorySongsDialog } from "./dialog";

export const RadarSection = ({ userId }: { userId?: string }) => {
  const { version, levels, diffs } = useStatsFilter();
  const { radar, isLoading } = useRadar(userId, levels, diffs, version);
  const [selectedCat, setSelectedCat] = useState<RadarCategory | null>(null);

  const sortedData = useMemo(() => {
    if (!radar) return [];
    return (Object.keys(radar) as RadarCategory[]).sort((a, b) => {
      return radar[b].totalBpi - radar[a].totalBpi;
    });
  }, [radar]);

  if (isLoading) return <RadarSkeleton />;
  if (!radar) return null;

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
        BPIレーダー
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
        <RadarSectionChart data={radar} />

        <VStack align="stretch" gap={2}>
          {sortedData.map((key) => {
            const bpi = radar[key].totalBpi;
            const style = getBpiColorStyle(bpi);
            return (
              <HStack
                key={key}
                justify="space-between"
                p={2}
                bg="whiteAlpha.50"
                borderRadius="md"
                cursor="pointer"
                _hover={{ bg: "whiteAlpha.200", transform: "translateX(4px)" }}
                onClick={() => setSelectedCat(key)}
                transition={".2s"}
              >
                <Text fontSize="xs" color="gray.300" fontWeight="bold">
                  {key}
                </Text>
                <Badge
                  variant="subtle"
                  borderColor={style.bg}
                  borderWidth={"1px"}
                  fontFamily="mono"
                  px={4}
                  borderRadius="sm"
                  fontSize="md"
                >
                  {bpi.toFixed(2)}
                </Badge>
              </HStack>
            );
          })}
        </VStack>
      </SimpleGrid>
      {selectedCat && (
        <RadarCategorySongsDialog
          categoryName={selectedCat}
          songs={radar[selectedCat].songs}
          isOpen={!!selectedCat}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </Box>
  );
};
