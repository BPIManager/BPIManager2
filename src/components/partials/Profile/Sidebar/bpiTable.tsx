import { VStack, For, Center, Grid, Text, Badge } from "@chakra-ui/react";

export const BpiHistoryTable = ({
  history,
  totalSongCount,
}: {
  history: any[];
  totalSongCount: number;
}) => (
  <VStack gap={1} align="stretch">
    <Grid
      templateColumns="1fr 2fr 2fr"
      gap={3}
      px={4}
      py={1}
      fontSize="9px"
      color="gray.600"
      fontWeight="black"
    >
      <Text>Ver</Text>
      <Text textAlign="center">Arena</Text>
      <Text textAlign="right">Total BPI</Text>
    </Grid>
    <For each={history}>
      {(hist: any) => (
        <Grid
          key={hist.version}
          templateColumns="1fr 2fr 2fr"
          gap={3}
          alignItems="center"
          fontSize="xs"
          p={2}
          px={4}
          bg="whiteAlpha.50"
          borderRadius="md"
        >
          <Text fontWeight="bold" color="gray.400" fontFamily="mono">
            {hist.version}
          </Text>
          <Center>
            {hist.arenaRank !== "N/A" ? (
              <Badge
                px={2}
                size="sm"
                variant="subtle"
                colorPalette="gray"
                fontSize="9px"
              >
                {hist.arenaRank}
              </Badge>
            ) : (
              <Text color="gray.700">-</Text>
            )}
          </Center>
          <Text
            fontFamily="mono"
            color="blue.200"
            fontWeight="bold"
            textAlign="right"
          >
            {hist.totalBpi?.toFixed(2)}
          </Text>
        </Grid>
      )}
    </For>
  </VStack>
);
