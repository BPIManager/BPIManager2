import { SimpleGrid, Box, Text, Icon, VStack } from "@chakra-ui/react";
import { PlusCircle } from "lucide-react";
import { LuTrendingUp, LuMusic } from "react-icons/lu";

export const BatchSummaryCards = ({ summary }: { summary: any }) => {
  const stats = [
    {
      label: "総合BPI上昇",
      value: `+${summary.avgBpiDiff.toFixed(2)}`,
      icon: PlusCircle,
      color: "blue.200",
    },
    {
      label: "更新",
      value: summary.updatedScores,
      icon: PlusCircle,
      color: "orange.200",
    },
    {
      label: "新規",
      value: summary.newRecords,
      icon: LuMusic,
      color: "purple.200",
    },
  ];

  return (
    <SimpleGrid columns={{ base: 3, md: 3 }} gap={4}>
      {stats.map((stat, i) => (
        <Box
          p={5}
          bg="#0d1117"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
          w="full"
          key={i}
        >
          <VStack align="start" gap={1}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="gray.200"
              letterSpacing="widest"
            >
              {stat.label}
            </Text>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color={stat.color}
              fontFamily="mono"
            >
              {stat.value}
            </Text>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
};
