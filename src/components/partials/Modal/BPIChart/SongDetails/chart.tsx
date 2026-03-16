import { Box, Separator, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SongWithScore } from "@/types/songs/withScore";
import { DashCard } from "@/components/ui/dashcard";

interface BPIAnimatedChartProps {
  data: { label: string; count: number; bpi: number }[];
  maxScore: number;
  song: SongWithScore;
}

const ChartTooltip = ({ active, payload, youScore, maxScore }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isYou = data.label === "YOU";
  const rate = ((data.count / maxScore) * 100).toFixed(2);
  const diff = data.count - youScore;

  return (
    <Box
      bg="gray.900"
      p={3}
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="md"
      boxShadow="xl"
    >
      <VStack align="start" gap={1}>
        <Text color="blue.300" fontSize="xs" fontWeight="bold">
          BPI: {isYou ? data.bpi.toFixed(2) : data.label}
        </Text>

        <Separator opacity={0.2} />

        <Text color="white" fontSize="sm" fontWeight="bold">
          Score: {data.count.toLocaleString()} ({rate}%)
        </Text>

        {!isYou && (
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={diff > 0 ? "red.400" : "green.400"}
          >
            {diff > 0 ? `あと ${diff} 点` : `${Math.abs(diff)} 点超過`}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export const BPIChart = ({ data, maxScore }: BPIAnimatedChartProps) => {
  const chartData = useMemo(() => {
    return [...data].sort((a, b) => {
      const getVal = (d: any) =>
        d.label === "YOU" ? d.bpi : parseFloat(d.label);
      return getVal(b) - getVal(a);
    });
  }, [data]);
  const youScore = data.find((d) => d.label === "YOU")?.count ?? 0;
  const yMin = useMemo(() => {
    const kaidenAvg = data.find((d) => d.label === "0")?.count ?? 0;
    return Math.floor(kaidenAvg - maxScore * 0.05);
  }, [data, maxScore]);

  const borders = useMemo(() => {
    const ranks = [
      { label: "MAX-", ratio: 17 / 18 },
      { label: "AAA", ratio: 8 / 9 },
      { label: "AA", ratio: 7 / 9 },
      { label: "A", ratio: 6 / 9 },
    ];
    return ranks
      .map((r) => ({
        ...r,
        score: Math.ceil(maxScore * r.ratio),
      }))
      .filter((b) => b.score > yMin);
  }, [maxScore, yMin]);

  return (
    <DashCard h="400px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            padding={{ left: 10, right: 10 }}
            tick={{ fill: "#a0aec0", fontSize: 11, fontWeight: "bold" }}
          />

          <YAxis domain={[yMin, maxScore]} hide />
          <Tooltip
            content={<ChartTooltip youScore={youScore} maxScore={maxScore} />}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          {borders.map((b) => (
            <ReferenceLine
              key={b.label}
              y={b.score}
              stroke="#4A5568"
              strokeDasharray="4 4"
              label={{
                value: b.label,
                position: "insideBottomRight",
                fill: "#718096",
                fontSize: 10,
                fontWeight: "bold",
                dy: 12,
                dx: 0,
              }}
            />
          ))}

          <Bar dataKey="count" animationDuration={800} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.label === "YOU" ? "#ECC94B" : "#3182CE"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </DashCard>
  );
};
