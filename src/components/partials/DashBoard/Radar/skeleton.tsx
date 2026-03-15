import { DashCard } from "@/components/ui/dashcard";
import {
  Box,
  SimpleGrid,
  VStack,
  Skeleton,
  Center,
  Circle,
} from "@chakra-ui/react";

export const RadarSkeleton = () => {
  return (
    <DashCard>
      <Skeleton width="100px" height="14px" mb={4} />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
        <Center h="300px">
          <Box position="relative" w="200px" h="200px">
            <Circle
              size="200px"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              position="absolute"
            />
            <Circle
              size="140px"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              position="absolute"
              top="30px"
              left="30px"
            />
            <Circle
              size="80px"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              position="absolute"
              top="60px"
              left="60px"
            />
            <Box
              w="100%"
              h="100%"
              bg="blue.500"
              opacity={0.1}
              style={{
                clipPath:
                  "polygon(50% 10%, 90% 40%, 80% 80%, 30% 90%, 10% 50%)",
              }}
            />
          </Box>
        </Center>

        <VStack align="stretch" gap={2}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="36px" borderRadius="md" />
          ))}
        </VStack>
      </SimpleGrid>
    </DashCard>
  );
};
