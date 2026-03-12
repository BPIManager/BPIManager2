import {
  Box,
  VStack,
  HStack,
  Text,
  Separator,
  Badge,
  Flex,
} from "@chakra-ui/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { RadarResponse } from "@/hooks/stats/useRadar";
import { useMemo } from "react";

const RadarDefs = () => (
  <svg style={{ height: 0, width: 0, position: "absolute" }} aria-hidden="true">
    <defs>
      <radialGradient id="radarMeGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
      </radialGradient>
      <radialGradient id="radarRivalGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f97316" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
      </radialGradient>
      <radialGradient id="dotMeMax" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
      </radialGradient>
      <radialGradient id="dotRivalMax" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="#f97316" stopOpacity={1} />
      </radialGradient>
    </defs>
  </svg>
);

const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, r } = props;
  const isMe = dataKey === "value";
  const isMax = isMe ? payload.isMeMax : payload.isRivalMax;
  const color = isMe ? "#3b82f6" : "#f97316";
  const grad = isMe ? "url(#dotMeMax)" : "url(#dotRivalMax)";

  if (isMax) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r + 3} fill={color} fillOpacity={0.3} />
        <circle
          cx={cx}
          cy={cy}
          r={r + 0.5}
          fill={grad}
          stroke="white"
          strokeWidth={1}
        />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={2} fill={color} fillOpacity={0.6} />;
};

const RadarCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const meVal = data.value;
    const rivalVal = data.rivalValue;
    const hasRival = rivalVal !== undefined;

    return (
      <Box
        bg="gray.900"
        p={3}
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="md"
        boxShadow="dark-lg"
        minW="160px"
      >
        <VStack align="start" gap={1}>
          <Text color="white" fontSize="xs" fontWeight="bold">
            {data.category.toUpperCase()}
          </Text>
          <Separator my={1} borderColor="whiteAlpha.200" />

          <HStack justify="space-between" w="full">
            <HStack gap={2}>
              <Box w="2" h="2" borderRadius="full" bg="blue.400" />
              <Text color="blue.300" fontSize="xs" fontWeight="bold">
                YOU
              </Text>
            </HStack>
            <HStack gap={1}>
              <Text color="white" fontSize="xs" fontWeight="bold">
                {meVal.toFixed(2)}
              </Text>
              {data.isMeMax && (
                <Badge
                  size="xs"
                  colorPalette="blue"
                  variant="solid"
                  fontSize="8px"
                >
                  BEST
                </Badge>
              )}
            </HStack>
          </HStack>

          {hasRival && (
            <>
              <HStack justify="space-between" w="full">
                <HStack gap={2}>
                  <Box w="2" h="2" borderRadius="full" bg="orange.400" />
                  <Text color="orange.300" fontSize="xs" fontWeight="bold">
                    RIVAL
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <Text color="white" fontSize="xs" fontWeight="bold">
                    {rivalVal.toFixed(2)}
                  </Text>
                  {data.isRivalMax && (
                    <Badge
                      size="xs"
                      colorPalette="orange"
                      variant="solid"
                      fontSize="8px"
                    >
                      BEST
                    </Badge>
                  )}
                </HStack>
              </HStack>
              <Flex
                w="full"
                mt={1}
                justify="center"
                bg={meVal >= rivalVal ? "green.900" : "red.900"}
                borderRadius="sm"
                py={0.5}
              >
                <Text fontSize="9px" fontWeight="bold" color="white">
                  {meVal >= rivalVal
                    ? `WIN (+${(meVal - rivalVal).toFixed(2)})`
                    : `LOSE (${(meVal - rivalVal).toFixed(2)})`}
                </Text>
              </Flex>
            </>
          )}
        </VStack>
      </Box>
    );
  }
  return null;
};

interface RadarChartProps {
  data: RadarResponse;
  rivalData?: Record<string, number>;
  isMini?: boolean;
}

export const RadarSectionChart = ({
  data,
  rivalData,
  isMini = false,
}: RadarChartProps) => {
  const chartData = useMemo(() => {
    const raw = Object.entries(data).map(([key, value]) => ({
      category: key,
      value: Math.max(value.totalBpi, -15),
      rivalValue: rivalData ? Math.max(rivalData[key] ?? -15, -15) : undefined,
    }));

    const meMax = Math.max(...raw.map((d) => d.value));
    const rivalMax = rivalData
      ? Math.max(...raw.map((d) => d.rivalValue || -15))
      : -15;

    return raw.map((d) => ({
      ...d,
      isMeMax: d.value === meMax && meMax > -15,
      isRivalMax: rivalData && d.rivalValue === rivalMax && rivalMax > -15,
    }));
  }, [data, rivalData]);

  const domain = useMemo(() => {
    const allValues = chartData.flatMap(
      (d) => [d.value, d.rivalValue].filter((v) => v !== undefined) as number[],
    );
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = Math.max(max - min, 10);
    const padding = range * 0.2;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <Box w="full" h={isMini ? "150px" : "330px"} position="relative">
      <RadarDefs />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          {!isMini && (
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }}
            />
          )}
          <PolarRadiusAxis domain={domain} tick={false} axisLine={false} />

          {!isMini && (
            <Tooltip content={<RadarCustomTooltip />} cursor={false} />
          )}

          <Radar
            name="YOU"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#radarMeGradient)"
            fillOpacity={1}
            dot={<CustomDot />}
            isAnimationActive={!isMini}
          />

          {rivalData && (
            <Radar
              name="RIVAL"
              dataKey="rivalValue"
              stroke="#f97316"
              strokeWidth={1.5}
              fill="url(#radarRivalGradient)"
              fillOpacity={0.6}
              dot={<CustomDot />}
              isAnimationActive={!isMini}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};
