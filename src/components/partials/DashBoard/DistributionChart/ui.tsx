import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { DistributionChartSkeleton } from "@/components/partials/DashBoard/DistributionChart/skeleton";
import { DashCard } from "@/components/ui/dashcard";

const bounceGrow = keyframes`
  0% { transform: scaleY(0); }
  60% { transform: scaleY(1.1); }
  80% { transform: scaleY(0.95); }
  100% { transform: scaleY(1); }
`;

export interface ChartData {
  label: string;
  count: number;
}

interface DistributionChartProps {
  title: string;
  myData: ChartData[];
  rivalData?: ChartData[];
  isLoading: boolean;
  getColor: (label: string) => string;
  myName?: string;
  rivalName?: string;
  skeletonCount?: number;
}

const ChartBarUnit = ({
  label,
  myCount,
  rivalCount,
  maxCount,
  color,
  index,
}: {
  label: string;
  myCount: number;
  rivalCount?: number;
  maxCount: number;
  color: string;
  isRotated?: boolean;
  index: number;
}) => {
  const hasRival = rivalCount !== undefined;
  const myHeight = `${(myCount / maxCount) * 100}%`;
  const rivalHeight = hasRival ? `${(rivalCount / maxCount) * 100}%` : "0%";

  return (
    <VStack
      key={label}
      flex="1 1 0%"
      minW="0"
      maxW="60px"
      gap={0}
      align="stretch"
      h="180px"
    >
      <Box h="150px" position="relative" w="full">
        <HStack
          position="absolute"
          bottom="25px"
          left="0"
          right="0"
          h="100px"
          align="flex-end"
          justify="center"
          gap={hasRival ? "2px" : "0"}
        >
          <VStack
            h="full"
            justify="flex-end"
            flex="1"
            minW="0"
            position="relative"
          >
            <Text
              fontSize="10px"
              color="blue.300"
              fontWeight="bold"
              whiteSpace="nowrap"
              visibility={myCount > 0 ? "visible" : "hidden"}
              {...(hasRival
                ? {
                    position: "absolute",
                    bottom: "calc(100% + 2px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }
                : {
                    position: "relative",
                    w: "full",
                    textAlign: "center",
                    mb: "2px",
                  })}
            >
              {myCount}
            </Text>
            <Box
              w="full"
              h={myHeight}
              bg={color}
              borderRadius="t-xs"
              transformOrigin="bottom"
              animation={`${bounceGrow} 0.6s ease-out both`}
              animationDelay={`${index * 0.04}s`}
              opacity={0.9}
              borderTop="2px solid"
              borderColor="blue.300"
            />
          </VStack>

          {hasRival && (
            <VStack
              h="full"
              justify="flex-end"
              flex="1"
              minW="0"
              position="relative"
            >
              <Box
                w="full"
                h={rivalHeight}
                bg={color}
                borderRadius="t-xs"
                transformOrigin="bottom"
                animation={`${bounceGrow} 0.6s ease-out both`}
                animationDelay={`${index * 0.04 + 0.02}s`}
                opacity={0.45}
                borderTop="2px solid"
                borderColor="orange.300"
              />
            </VStack>
          )}
        </HStack>

        {hasRival && (
          <Text
            position="absolute"
            bottom="5px"
            left="50%"
            transform="translateX(-50%)"
            fontSize="10px"
            color="orange.300"
            fontWeight="bold"
            visibility={rivalCount > 0 ? "visible" : "hidden"}
          >
            {rivalCount}
          </Text>
        )}
      </Box>

      <Box h="1px" bg="whiteAlpha.200" w="full" />

      <Box h="30px" display="flex" justifyContent="center">
        <Text
          fontSize="10px"
          fontWeight="bold"
          color="gray.400"
          mt={2}
          whiteSpace="nowrap"
        >
          {label}
        </Text>
      </Box>
    </VStack>
  );
};

export const DistributionChart = ({
  title,
  myData,
  rivalData,
  isLoading,
  getColor,
  myName = "自分",
  rivalName = "ライバル",
  skeletonCount = 10,
}: DistributionChartProps) => {
  if (isLoading) {
    return <DistributionChartSkeleton count={skeletonCount} />;
  }

  if (!myData || myData.length === 0) return null;

  const rivalMap = rivalData
    ? new Map(rivalData.map((d) => [d.label, d.count]))
    : null;

  const maxCount = Math.max(
    ...myData.map((d) => d.count),
    ...(rivalData?.map((d) => d.count) || []),
    1,
  );

  return (
    <DashCard>
      <HStack justify="space-between" mb={6}>
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="gray.400"
          textTransform="uppercase"
        >
          {title}
        </Text>

        {rivalData && (
          <HStack gap={3}>
            <HStack gap={1}>
              <Box w="8px" h="8px" borderRadius="full" bg="blue.400" />
              <Text fontSize="xs" color="blue.300">
                {myName}
              </Text>
            </HStack>
            <HStack gap={1}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="orange.400"
                opacity={0.6}
              />
              <Text fontSize="xs" color="orange.300">
                {rivalName}
              </Text>
            </HStack>
          </HStack>
        )}
      </HStack>

      <HStack align="flex-start" justify="space-between" gap={1} px={1}>
        {myData.map((item, i) => (
          <ChartBarUnit
            key={item.label}
            label={item.label}
            myCount={item.count}
            rivalCount={rivalMap?.get(item.label)}
            maxCount={maxCount}
            color={getColor(item.label)}
            index={i}
          />
        ))}
      </HStack>
    </DashCard>
  );
};
