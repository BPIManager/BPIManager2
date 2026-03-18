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
import { useChartColors } from "@/hooks/common/useChartColors";

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
    <div className="rounded-lg border border-bpim-border bg-bpim-surface p-3 shadow-2xl">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-bold text-bpim-primary uppercase tracking-wider">
          BPI: {isYou ? data.bpi.toFixed(2) : data.label}
        </p>

        <Separator className="bg-bpim-overlay/60" />

        <div className="flex flex-col gap-0.5">
          <p className="font-mono text-sm font-bold text-bpim-text">
            Score: {data.count}
          </p>
          <p className="font-mono text-[10px] text-bpim-muted">Rate: {rate}%</p>
        </div>

        {!isYou && (
          <p
            className={cn(
              "mt-1 text-[11px] font-black",
              diff > 0 ? "text-bpim-danger" : "text-bpim-success",
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
  const c = useChartColors();

  const chartData = useMemo(() => {
    return [...data].sort((a, b) => {
      const getVal = (d: typeof a) =>
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
      .map((r) => ({ ...r, score: Math.ceil(maxScore * r.ratio) }))
      .filter((b) => b.score > yMin);
  }, [maxScore, yMin]);

  return (
    <div className="h-[320px] w-full rounded-xl border border-bpim-border bg-bpim-surface-2/40 p-4 md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.muted, fontSize: 10, fontWeight: "bold" }}
            interval={0}
          />
          <YAxis domain={[yMin, maxScore]} hide />

          <Tooltip
            content={<ChartTooltip youScore={youScore} maxScore={maxScore} />}
            cursor={{ fill: c.primaryRgba(0.04) }}
            animationDuration={200}
          />

          {borders.map((b) => (
            <ReferenceLine
              key={b.label}
              y={b.score}
              stroke={c.warning}
              strokeOpacity={0.5}
              strokeDasharray="4 4"
              label={{
                position: "insideBottomRight",
                value: b.label,
                fill: c.warning,
                fontSize: 10,
                fontWeight: "bold",
              }}
            />
          ))}

          <Bar dataKey="count" animationDuration={1000} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.label === "YOU" ? c.warning : c.primary}
                fillOpacity={entry.label === "YOU" ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
