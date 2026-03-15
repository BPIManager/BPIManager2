import { DashCard } from "@/components/ui/dashcard";
import { Box, Skeleton, VStack, HStack } from "@chakra-ui/react";

export const ActivityCalendarSkeleton = () => {
  return (
    <DashCard>
      <Skeleton h="20px" w="120px" mb={4} />
      <HStack align="start" gap={3}>
        <VStack gap={3} pt={6}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="8px" w="20px" />
          ))}
        </VStack>
        <Skeleton h="135px" flex="1" borderRadius="sm" />
      </HStack>
    </DashCard>
  );
};
