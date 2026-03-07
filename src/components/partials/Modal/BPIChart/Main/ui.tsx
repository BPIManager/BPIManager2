import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from "recharts";
import { Box, Text } from "@chakra-ui/react";
import { SongWithScore } from "@/types/songs/withScore";
import { BpiCalculator } from "@/lib/bpi";

interface BPIChartProps {
  song: SongWithScore;
  chartData: { name: string; score: number }[];
}

export const BPIChart = ({ song, chartData }: BPIChartProps) => {
  const max = song.notes * 2;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rate = ((data.score / max) * 100).toFixed(2);
      return (
        <Box
          bg="gray.900"
          p={2}
          border="1px solid"
          borderColor="whiteAlpha.300"
          fontSize="xs"
        >
          <Text
            fontWeight="bold"
            color={data.name === "YOU" ? "yellow.400" : "white"}
          >
            {data.name === "YOU" ? "YOUR SCORE" : `BPI ${data.name}`}
          </Text>
          <Text>EX: {data.score}</Text>
          <Text>RATE: {rate}%</Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box w="full" h="250px" mt={4}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="name" stroke="#666" fontSize={10} />
          <YAxis domain={[0, max]} hide />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "whiteAlpha.100" }}
          />
          <Bar dataKey="score" isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === "YOU" ? "#ECC94B" : "#3182CE"}
              />
            ))}
          </Bar>
          {[
            { y: Math.ceil(max * (8 / 9)), label: "AAA" },
            { y: Math.ceil(max * (7 / 9)), label: "AA" },
            { y: Math.ceil(max * (6 / 9)), label: "A" },
          ].map((line) => (
            <ReferenceLine
              key={line.label}
              y={line.y}
              stroke="#444"
              strokeDasharray="3 3"
              label={
                <Label
                  value={line.label}
                  position="insideRight"
                  fill="#666"
                  fontSize={10}
                />
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
