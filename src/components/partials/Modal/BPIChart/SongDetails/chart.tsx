"use client";

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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    <div className="rounded-lg border border-white/20 bg-bpim-bg p-3 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          BPI: {isYou ? data.bpi.toFixed(2) : data.label}
        </p>

        <Separator className="bg-white/10" />

        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold text-white font-mono">
            Score: {data.count}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Rate: {rate}%</p>
        </div>

        {!isYou && (
          <p
            className={cn(
              "text-[11px] font-black mt-1",
              diff > 0 ? "text-red-400" : "text-green-400",
            )}
          >
            {diff > 0 ? `あと ${diff} 点` : `${Math.abs(diff)} 点超過`}
          </p>
        )}
      </div>
    </div>
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
    return Math.max(0, Math.floor(kaidenAvg - maxScore * 0.05));
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
    <div className="h-[320px] md:h-[400px] w-full rounded-xl border border-bpim-border bg-bpim-bg/40 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
            interval={0}
          />
          <YAxis domain={[yMin, maxScore]} hide />
          <Tooltip
            content={<ChartTooltip youScore={youScore} maxScore={maxScore} />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            animationDuration={200}
          />
          {borders.map((b) => (
            <ReferenceLine
              key={b.label}
              y={b.score}
              stroke="#334155"
              strokeDasharray="4 4"
              label={{
                position: "insideBottomRight",
                value: b.label,
                fill: "#475569",
                fontSize: 9,
                fontWeight: "black",
              }}
            />
          ))}

          <Bar dataKey="count" animationDuration={1000} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.label === "YOU" ? "#fbbf24" : "#3b82f6"}
                fillOpacity={entry.label === "YOU" ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
