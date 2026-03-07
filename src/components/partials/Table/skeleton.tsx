import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Skeleton,
} from "@chakra-ui/react";

const SongItemSkeleton = () => {
  return (
    <Box
      w="full"
      background="whiteAlpha.100"
      borderLeft="4px solid"
      borderLeftColor="whiteAlpha.200"
      mb={2}
    >
      <Grid templateColumns="1fr auto" gap={1}>
        <GridItem px={3} py={2}>
          <VStack align="start" gap={2}>
            <Skeleton height="14px" width="60%" />

            <HStack gap={3} mt={1}>
              <Skeleton height="18px" width="24px" borderRadius="sm" />
              <Skeleton height="12px" width="100px" />
            </HStack>
          </VStack>
        </GridItem>

        <GridItem
          display="flex"
          alignItems="center"
          background="blackAlpha.200"
          p={{ mdDown: 2, lg: 4 }}
        >
          <HStack gap={4}>
            <VStack align="end" gap={1}>
              <Skeleton height="8px" width="15px" />
              <Skeleton height="20px" width="40px" />
            </VStack>
            <VStack align="end" gap={1}>
              <Skeleton height="8px" width="15px" />
              <Skeleton height="20px" width="45px" />
            </VStack>
          </HStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export const SongListSkeleton = () => {
  return (
    <Box w="full" p={2}>
      {Array.from({ length: 15 }).map((_, i) => (
        <SongItemSkeleton key={i} />
      ))}
    </Box>
  );
};
