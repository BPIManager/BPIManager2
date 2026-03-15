import { Box, Text, HStack, VStack, Separator } from "@chakra-ui/react";
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
  Brush,
  Rectangle,
} from "recharts";
import { BpiHistoryItem } from "@/hooks/stats/useTotalBPIHistory";
import { TotalBpiHistorySkeleton } from "@/components/partials/DashBoard/TotalBPIHistory/skeleton";
import { DashCard } from "@/components/ui/dashcard";

const UpdateBar = (props: any) => {
  const { payload } = props;
  if (payload.rivalBpi !== undefined) return null;
  const fill = payload.updateCount > 0 ? "#3182ce" : "transparent";
  return (
    <Rectangle {...props} fill={fill} opacity={0.3} radius={[2, 2, 0, 0]} />
  );
};

const HistoryTooltip = ({ active, payload, label, myName, rivalName }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isComparison = data.rivalBpi !== undefined;

  return (
    <Box
      bg="gray.900"
      p={3}
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="md"
      boxShadow="xl"
      minW="200px"
      maxW="300px"
    >
      <VStack align="start" gap={1}>
        <Text color="gray.400" fontSize="xs" fontWeight="bold">
          {label}
        </Text>

        {isComparison ? (
          <>
            <HStack justify="space-between" w="full">
              <Text color="blue.300" fontSize="xs" fontWeight="bold">
                {myName}
              </Text>
              <Text color="blue.300" fontSize="sm" fontWeight="bold">
                {data.myBpi?.toFixed(2)}
              </Text>
            </HStack>
            <HStack justify="space-between" w="full">
              <Text color="orange.300" fontSize="xs" fontWeight="bold">
                {rivalName}
              </Text>
              <Text color="orange.300" fontSize="sm" fontWeight="bold">
                {data.rivalBpi?.toFixed(2)}
              </Text>
            </HStack>
            <Separator borderColor="whiteAlpha.200" my={1} />
            <HStack justify="space-between" w="full">
              <Text color="gray.400" fontSize="xs">
                差分
              </Text>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={data.myBpi - data.rivalBpi > 0 ? "green.400" : "red.400"}
              >
                {data.myBpi - data.rivalBpi > 0 ? "+" : ""}
                {(data.myBpi - data.rivalBpi).toFixed(2)}
              </Text>
            </HStack>
          </>
        ) : (
          <>
            <HStack justify="space-between" w="full">
              <Text color="blue.300" fontSize="sm" fontWeight="bold">
                総合BPI: {data.myBpi?.toFixed(2)}
              </Text>
              <Text color="gray.500" fontSize="xs">
                累計: {data.count}曲
              </Text>
            </HStack>
            {data.updateCount > 0 && (
              <>
                <Separator my={2} borderColor="whiteAlpha.200" />
                <Text color="green.300" fontSize="xs" fontWeight="bold">
                  UPDATED: {data.updateCount} items
                </Text>
                <Box maxH="120px" overflowY="auto" w="full" pr={1}>
                  {data.updatedSongs?.map((song: string, idx: number) => (
                    <Text key={idx} color="whiteAlpha.800" fontSize="10px">
                      • {song}
                    </Text>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

interface UnifiedBpiHistoryChartProps {
  myData?: BpiHistoryItem[];
  rivalData?: BpiHistoryItem[];
  isLoading: boolean;
  myName?: string;
  rivalName?: string;
}

export const TotalBpiHistoryChart = ({
  myData,
  rivalData,
  isLoading,
  myName = "自分",
  rivalName = "ライバル",
}: UnifiedBpiHistoryChartProps) => {
  const { chartData, ticks, startIndex } = useMemo(() => {
    if (!myData && !rivalData)
      return { chartData: [], ticks: [], startIndex: 0 };

    const dateSet = new Set<string>();
    myData?.forEach((d) => dateSet.add(d.date));
    rivalData?.forEach((d) => dateSet.add(d.date));
    const allDates = Array.from(dateSet).sort();

    const myMap = new Map(myData?.map((d) => [d.date, d]));
    const rivalMap = new Map(rivalData?.map((d) => [d.date, d]));

    let lastMy: any = null;
    let lastRival: any = null;

    const merged = allDates.map((date) => {
      const myEntry = myMap.get(date);
      const rivalEntry = rivalMap.get(date);

      if (myEntry) lastMy = myEntry;
      if (rivalEntry) lastRival = rivalEntry;

      return {
        date,
        myBpi: myEntry?.totalBpi ?? lastMy?.totalBpi,
        rivalBpi: rivalData
          ? (rivalEntry?.totalBpi ?? lastRival?.totalBpi)
          : undefined,
        updateCount: myEntry?.updatedSongs?.length || 0,
        updatedSongs: myEntry?.updatedSongs || [],
        count: myEntry?.count || lastMy?.count,
      };
    });

    const interval = Math.max(1, Math.floor(merged.length / 10));
    const calculatedTicks = merged
      .filter((_, i) => i % interval === 0 || i === merged.length - 1)
      .map((d) => d.date);

    return {
      chartData: merged,
      ticks: calculatedTicks,
      startIndex: Math.max(0, merged.length - 30),
    };
  }, [myData, rivalData]);

  if (isLoading) return <TotalBpiHistorySkeleton />;
  if (chartData.length === 0) return null;

  const formatDate = (value: string, index: number) => {
    const date = new Date(value);
    return index === 0 ||
      date.getFullYear() !== new Date(ticks[index - 1]).getFullYear()
      ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <DashCard h="420px">
      <HStack justify="space-between" mb={6}>
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="gray.400"
          textTransform="uppercase"
        >
          総合BPI推移
        </Text>
        {rivalData && (
          <HStack gap={4}>
            <HStack gap={1}>
              <Box w="12px" h="2px" bg="blue.400" />
              <Text fontSize="xs" color="blue.300">
                {myName}
              </Text>
            </HStack>
            <HStack gap={1}>
              <Box w="12px" h="2px" bg="orange.400" strokeDasharray="5 3" />
              <Text fontSize="xs" color="orange.300">
                {rivalName}
              </Text>
            </HStack>
          </HStack>
        )}
      </HStack>

      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            stroke="#4A5568"
            fontSize={10}
            tickFormatter={(v) => v.toFixed(1)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis yAxisId="right" hide />

          <Tooltip
            content={<HistoryTooltip myName={myName} rivalName={rivalName} />}
            cursor={{ stroke: "#2D3748" }}
          />

          {!rivalData && (
            <Bar
              yAxisId="right"
              dataKey="updateCount"
              barSize={4}
              shape={<UpdateBar />}
            />
          )}

          <Line
            type="monotone"
            dataKey="myBpi"
            stroke="#63B3ED"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#0d1117",
              stroke: "#63B3ED",
              strokeWidth: 2,
            }}
            connectNulls
            animationDuration={1000}
          />

          {rivalData && (
            <Line
              type="monotone"
              dataKey="rivalBpi"
              stroke="#F6AD55"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              connectNulls
              animationDuration={1200}
            />
          )}

          <Brush
            dataKey="date"
            height={30}
            stroke="#2D3748"
            fill="#0d1117"
            startIndex={startIndex}
            tickFormatter={() => ""}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </DashCard>
  );
};
