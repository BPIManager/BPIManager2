import { Box, HStack, Text, VStack, Flex, Separator } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { Tooltip } from "@/components/ui/tooltip"; //
import { useState } from "react";

const bounceGrow = keyframes`
  0% { transform: scaleY(0); }
  60% { transform: scaleY(1.05); }
  100% { transform: scaleY(1); }
`;

const colorTransition = keyframes`
  from { background-color: #4A5568; }
`;

interface BPIAnimatedChartProps {
  data: { label: string; count: number; bpi: number }[];
  maxScore: number;
}

export const BPIChart = ({ data, maxScore }: BPIAnimatedChartProps) => {
  const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null);

  const BPI_MIN = -15;
  const BPI_MAX = Math.max(...data.map((d) => d.bpi), 100);
  const bpiRange = BPI_MAX - BPI_MIN;

  const youScore = data.find((d) => d.label === "YOU")?.count ?? 0;

  const getBarColor = (label: string) =>
    label === "YOU" ? "#ECC94B" : "#3182CE";

  return (
    <Box
      p={6}
      bg="#0d1117"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      borderLeft={"none"}
      borderRight={"none"}
      w="full"
    >
      <HStack align="flex-end" justify="space-between" gap={1} px={1} h="300px">
        {data.map((item, i) => {
          const relativeBpi = item.bpi - BPI_MIN; //
          const barHeight = `${Math.max(5, (relativeBpi / bpiRange) * 100)}%`; //

          const isYou = item.label === "YOU";
          const targetColor = getBarColor(item.label);

          const scoreRate = ((item.count / maxScore) * 100).toFixed(2); //

          const scoreDiff = item.count - youScore; //
          const diffText = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;
          const diffColor =
            scoreDiff > 0 ? "red.400" : scoreDiff < 0 ? "blue.400" : "gray.400";
          const tooltipItems = [
            { label: "Score", value: item.count.toLocaleString() },
            { label: "Rate", value: `${scoreRate}%` },
            ...(!isYou
              ? [
                  {
                    label: "Diff",
                    value: diffText,
                    color: diffColor,
                  },
                ]
              : []),
          ];
          return (
            <VStack
              key={item.label}
              flex={1}
              h="full"
              gap={0}
              justify="flex-end"
            >
              <Tooltip
                showArrow
                portalled
                closeOnPointerDown={false}
                openDelay={0}
                closeDelay={500}
                open={openTooltipIndex === i}
                content={
                  <VStack gap={1} align="start" p={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.800">
                      BPI {isYou ? "CURRENT" : item.label}
                    </Text>
                    <Separator opacity={0.2} />

                    {tooltipItems.map((row) => (
                      <HStack
                        key={row.label}
                        justify="space-between"
                        w="full"
                        gap={4}
                      >
                        <Text fontSize="xs" color="gray.400">
                          {row.label}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color={row.color || "inherit"}
                        >
                          {row.value}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                }
              >
                <Flex
                  direction="column"
                  justify="flex-end"
                  align="center"
                  w="full"
                  h="full"
                  cursor="help"
                  tabIndex={0}
                  outline="none"
                  _focus={{
                    filter: "brightness(1.3)",
                    transform: "scaleX(1.1)",
                  }}
                  onMouseEnter={() => setOpenTooltipIndex(i)}
                  onMouseLeave={() => setOpenTooltipIndex(null)}
                  onClick={() =>
                    setOpenTooltipIndex(openTooltipIndex === i ? null : i)
                  }
                >
                  <Text
                    fontSize="9px"
                    color={isYou ? "yellow.400" : "gray.600"}
                    fontWeight="bold"
                    mb={2}
                  >
                    {item.count}
                  </Text>
                  <Box
                    w="full"
                    h={barHeight}
                    bg={targetColor}
                    borderRadius="sm"
                    borderBottomRadius="none"
                    transformOrigin="bottom"
                    animation={`${bounceGrow} 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67) both`}
                    animationDelay={`${i * 0.05}s`}
                    transition="height 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s"
                  />
                </Flex>
              </Tooltip>

              <Box h="1.5px" bg="whiteAlpha.300" w="full" />
              <Box
                h="35px"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Text
                  fontSize="11px"
                  fontWeight="black"
                  color={isYou ? "yellow.400" : "gray.400"}
                >
                  {item.label}
                </Text>
              </Box>
            </VStack>
          );
        })}
      </HStack>
    </Box>
  );
};
