import { Box, Text, SimpleGrid, VStack, Badge, HStack } from "@chakra-ui/react";
import { useRadar } from "@/hooks/stats/useRadar";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { RadarSkeleton } from "./skeleton";
import { RadarSectionChart } from "./ui";
import { RadarCategory } from "@/types/stats/radar";
import { useMemo, useState } from "react";
import { RadarCategorySongsDialog } from "./dialog";
import { getBpiColorStyle } from "@/constants/bpiColor";

interface RadarSectionProps {
  userId?: string;
  rivalUserId?: string;
  rivalName?: string;
}

export const RadarSection = ({
  userId,
  rivalUserId,
  rivalName,
}: RadarSectionProps) => {
  const { version, levels, diffs } = useStatsFilter();
  const { radar, isLoading } = useRadar(userId, levels, diffs, version);
  const { radar: rivalRadar, isLoading: rivalLoading } = useRadar(
    rivalUserId,
    levels,
    diffs,
    version,
  );
  const [selectedCat, setSelectedCat] = useState<RadarCategory | null>(null);

  const isRivalMode = !!rivalUserId;

  const sortedData = useMemo(() => {
    if (!radar) return [];
    return (Object.keys(radar) as RadarCategory[]).sort((a, b) => {
      return radar[b].totalBpi - radar[a].totalBpi;
    });
  }, [radar]);

  if (isLoading || (isRivalMode && rivalLoading)) return <RadarSkeleton />;
  if (!radar) return null;

  const rivalDataFlat = rivalRadar
    ? Object.fromEntries(
        Object.entries(rivalRadar).map(([k, v]) => [k, v.totalBpi]),
      )
    : undefined;

  return (
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
    >
      <HStack justify="space-between" mb={4}>
        <Text fontSize="sm" fontWeight="bold" color="gray.400">
          BPIレーダー
        </Text>
        {isRivalMode && (
          <HStack gap={4}>
            <HStack gap={1}>
              <Box w="10px" h="10px" borderRadius="full" bg="blue.400" />
              <Text fontSize="xs" color="blue.300">
                自分
              </Text>
            </HStack>
            <HStack gap={1}>
              <Box w="10px" h="10px" borderRadius="full" bg="orange.400" />
              <Text fontSize="xs" color="orange.300">
                {rivalName ?? "ライバル"}
              </Text>
            </HStack>
          </HStack>
        )}
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
        <RadarSectionChart data={radar} rivalData={rivalDataFlat} />

        <VStack align="stretch" gap={2}>
          {sortedData.map((key) => {
            const bpi = radar[key].totalBpi;
            const rivalBpi = rivalRadar ? rivalRadar[key]?.totalBpi : undefined;
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
                <HStack gap={2}>
                  {isRivalMode && rivalBpi !== undefined && (
                    <Badge
                      variant="subtle"
                      borderColor="#f97316"
                      borderWidth="1px"
                      fontFamily="mono"
                      px={2}
                      borderRadius="sm"
                      fontSize="sm"
                      color="orange.300"
                    >
                      {rivalBpi.toFixed(2)}
                    </Badge>
                  )}
                  <Badge
                    variant="subtle"
                    borderColor={style.bg}
                    borderWidth={"1px"}
                    fontFamily="mono"
                    px={2}
                    borderRadius="sm"
                    fontSize="sm"
                  >
                    {bpi.toFixed(2)}
                  </Badge>
                </HStack>
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
