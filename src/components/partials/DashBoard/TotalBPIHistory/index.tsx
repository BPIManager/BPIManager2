import {
  Box,
  Text,
  VStack,
  Spinner,
  Center,
  HStack,
  Separator,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
  Brush,
} from "recharts";
import { TotalBpiHistorySkeleton } from "./skeleton";

const renderCustomBar = (props: any) => {
  const { payload } = props;
  const fill = payload.updateCount > 0 ? "#3182ce" : "#1A202C";

  return (
    <Rectangle {...props} fill={fill} opacity={0.4} radius={[2, 2, 0, 0]} />
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const updateCount = data.updatedSongs?.length || 0;

    return (
      <Box
        bg="gray.900"
        p={3}
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="md"
        boxShadow="xl"
        maxW="300px"
      >
        <VStack align="start" gap={1}>
          <Text color="gray.400" fontSize="xs" fontWeight="bold">
            {label}
          </Text>
          <HStack justify="space-between" w="full">
            <Text color="blue.300" fontSize="sm" fontWeight="bold">
              総合BPI: {data.totalBpi.toFixed(2)}
            </Text>
            <Text color="gray.500" fontSize="xs">
              累計: {data.count}曲
            </Text>
          </HStack>

          {updateCount > 0 && (
            <>
              <Separator my={2} borderColor="whiteAlpha.200" />
              <Text color="green.300" fontSize="xs" fontWeight="bold" mb={1}>
                UPDATED: {updateCount} items
              </Text>
              <Box maxH="150px" overflowY="auto" w="full" pr={1}>
                {data.updatedSongs.map((song: string, idx: number) => (
                  <Text key={idx} color="whiteAlpha.800" fontSize="10px">
                    • {song}
                  </Text>
                ))}
              </Box>
            </>
          )}
        </VStack>
      </Box>
    );
  }
  return null;
};

export const TotalBpiHistoryChart = ({ data }: { data?: any[] }) => {
  const { chartData, ticks, startIndex } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], ticks: [], startIndex: 0 };

    const formatted = data.map((d) => ({
      ...d,
      updateCount: d.updatedSongs?.length || 0,
    }));

    const tickCount = 10;
    const interval = Math.max(1, Math.floor(formatted.length / tickCount));
    const calculatedTicks = formatted
      .filter((_, i) => i % interval === 0 || i === formatted.length - 1)
      .map((d) => d.date);

    return {
      chartData: formatted,
      ticks: calculatedTicks,
      startIndex: Math.max(0, formatted.length - 30),
    };
  }, [data]);

  if (chartData.length === 0) return null;

  const formatDate = (value: string, index: number) => {
    const date = new Date(value);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if (index === 0) return `${y}/${m}/${d}`;

    const prevTickDate = new Date(ticks[index - 1]);
    if (y !== prevTickDate.getFullYear()) {
      return `${y}/${m}/${d}`;
    }

    return `${m}/${d}`;
  };

  return (
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
      h="400px"
      _focus={{ outline: "none" }}
    >
      <Text
        fontSize="sm"
        fontWeight="bold"
        mb={6}
        color="gray.400"
        textTransform="uppercase"
      >
        総合BPI推移
      </Text>

      <ResponsiveContainer
        width="100%"
        height="80%"
        style={{ outline: "none" }}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          style={{ outline: "none" }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2D3748"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatDate}
            stroke="#4A5568"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0}
          />

          <YAxis
            yAxisId="left"
            domain={["dataMin - 1", "dataMax + 1"]}
            stroke="#4A5568"
            fontSize={10}
            tickFormatter={(v) => v.toFixed(1)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis yAxisId="right" hide={true} />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2D3748" }} />

          <Bar
            yAxisId="right"
            dataKey="updateCount"
            barSize={4}
            shape={renderCustomBar}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalBpi"
            stroke="#63B3ED"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              stroke: "#63B3ED",
              strokeWidth: 2,
              fill: "#0d1117",
            }}
            animationDuration={1500}
          />

          <Brush
            dataKey="date"
            height={30}
            stroke="#2D3748"
            fill="#0d1117"
            startIndex={startIndex}
            travellerWidth={10}
            tickFormatter={() => ""}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};
