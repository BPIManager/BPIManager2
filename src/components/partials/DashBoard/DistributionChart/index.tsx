import {
  Box,
  HStack,
  Text,
  VStack,
  Center,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const bounceGrow = keyframes`
  0% { transform: scaleY(0); }
  60% { transform: scaleY(1.1); }
  80% { transform: scaleY(0.95); }
  100% { transform: scaleY(1); }
`;

const colorTransition = keyframes`
  from { background-color: #4A5568; }
`;

export interface ChartData {
  label: string;
  count: number;
}

interface BaseChartProps {
  title: string;
  data?: ChartData[];
  isLoading: boolean;
  getColor: (label: string) => string;
  isRotated?: boolean;
}

export const BaseDistributionChart = ({
  title,
  data,
  isLoading,
  getColor,
  isRotated = false,
}: BaseChartProps) => {
  const maxCount = Math.max(...(data?.map((d) => d.count) || [0]), 1);

  if (isLoading) {
    return (
      <Center
        h="240px"
        bg="#0d1117"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <Spinner color="blue.500" />
      </Center>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
    >
      <Text
        fontSize="sm"
        fontWeight="bold"
        mb={6}
        color="gray.400"
        textTransform="uppercase"
      >
        {title}
      </Text>

      <HStack align="flex-start" justify="space-between" gap={1} px={1}>
        {data?.map((item, i) => {
          const barHeight = `${(item.count / maxCount) * 100}%`;
          const targetColor = getColor(item.label);

          return (
            <VStack key={item.label} flex={1} gap={0} align="stretch">
              <Flex
                direction="column"
                justify="flex-end"
                align="center"
                h="120px"
                position="relative"
              >
                <Text fontSize="10px" color="gray.500" fontWeight="bold" mb={1}>
                  {item.count > 0 ? item.count : ""}
                </Text>
                <Box
                  w="full"
                  h={barHeight}
                  bg={targetColor}
                  borderRadius="t-xs"
                  transformOrigin="bottom"
                  animation={`
                    ${bounceGrow} 0.6s ease-out both,
                    ${colorTransition} 0.6s ease-out both
                  `}
                  animationDelay={`${i * 0.04}s`}
                  transition="height 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s"
                  _hover={{
                    filter: "brightness(1.3)",
                    transform: "translateY(-2px)",
                  }}
                />
              </Flex>

              <Box h="1px" bg="whiteAlpha.200" w="full" />

              <Box
                h="40px"
                position="relative"
                display="flex"
                justifyContent="center"
              >
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color="gray.300"
                  whiteSpace="nowrap"
                  mt={2}
                  {...(isRotated && {
                    transform: "rotate(-45deg)",
                    transformOrigin: "top center",
                    fontSize: "9px",
                    mt: "12px",
                  })}
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
