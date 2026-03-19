"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label as RechartsLabel,
} from "recharts";
import { SongWithScore } from "@/types/songs/withScore";
import { cn } from "@/lib/utils";

interface BPIChartProps {
  song: SongWithScore;
  chartData: { name: string; score: number }[];
}

const CustomTooltip = ({ active, payload, maxScore }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rate = ((data.score / maxScore) * 100).toFixed(2);
    const isYou = data.name === "YOU";

    return (
      <div className="rounded-lg border border-bpim-border bg-bpim-bg p-3 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-wider",
              isYou ? "text-yellow-400" : "text-bpim-primary",
            )}
          >
            {isYou ? "Your Score" : `BPI Target: ${data.name}`}
          </p>
          <div className="h-[1px] w-full bg-bpim-overlay/60 my-1" />
          <p className="font-mono text-sm font-bold text-bpim-text">
            EX: {data.score}
          </p>
          <p className="font-mono text-[10px] text-bpim-muted">RATE: {rate}%</p>
        </div>
      </div>
    );
  }
  return null;
};

export const BPIChart = ({ song, chartData }: BPIChartProps) => {
  const max = song.notes * 2;

  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
          />
          <YAxis domain={[0, max]} hide />
          <Tooltip
            content={<CustomTooltip maxScore={max} />}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            isAnimationActive={false}
          />
          <Bar dataKey="score" isAnimationActive={false} radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === "YOU" ? "#fbbf24" : "#3b82f6"}
                fillOpacity={entry.name === "YOU" ? 1 : 0.7}
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
              stroke="#334155"
              strokeDasharray="3 3"
            >
              <RechartsLabel
                value={line.label}
                position="insideRight"
                fill="#475569"
                fontSize={9}
                fontWeight="black"
                dx={25}
              />
            </ReferenceLine>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
