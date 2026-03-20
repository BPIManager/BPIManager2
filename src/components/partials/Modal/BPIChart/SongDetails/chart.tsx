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
  Rectangle,
  LabelList,
  Label as RechartsLabel,
  TooltipProps,
} from "recharts";
import { SongWithScore } from "@/types/songs/withScore";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/common/useChartColors";

interface ChartDataItem {
  label: string;
  count: number;
  bpi: number;
}

interface BPIAnimatedChartProps {
  data: ChartDataItem[];
  maxScore: number;
  song: SongWithScore;
}

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartDataItem;
  c: ReturnType<typeof useChartColors>;
}

interface CustomLabelProps {
  x?: string|number;
  y?: string|number;
  width?: string|number;
  index?: number;
  chartData: ChartDataItem[];
  youScore: number;
}

interface ChartDataItem {
  label: string;
  count: number;
  bpi: number;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  chartData: ChartDataItem[];
  label: string | number | undefined;
  youScore: number;
  maxScore: number;
}

const CustomBarShape = (props: CustomBarProps) => {
  const { x, y, width, height, payload, c } = props;
  if (!payload || x === undefined || y === undefined) return null;

  const isYou = payload.label === "YOU";

  return (
    <Rectangle
      {...props}
      fill={isYou ? c.warning : c.primary}
      fillOpacity={isYou ? 1 : 0.5}
      radius={[4, 4, 0, 0]}
      className="transition-all duration-300"
    />
  );
};

const DataLabel = (props: CustomLabelProps) => {
  const { x, y, width, index, chartData, youScore } = props;
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    index === undefined ||
    !chartData[index]
  ) {
    return null;
  }

  const item = chartData[index];
  const value = item.count;
  const isYou = item.label === "YOU";
  const _x = Number(x);
  const _y = Number(y);
  const _width = Number(width);

  const diff = value - youScore;
  const diffColor = diff > 0 ? "#ef4444" : "#22c55e";

  return (
    <g>
      <text
        x={_x + _width / 2}
        y={_y - 18}
        fill={isYou ? "#fbbf24" : "#3b82f6"}
        textAnchor="middle"
        className="text-[10px] font-bold font-mono"
      >
        {value}
      </text>
      {!isYou && (
        <text
          x={_x + _width / 2}
          y={_y - 6}
          fill={diffColor}
          textAnchor="middle"
          className="text-[9px] font-bold font-mono"
        >
          {diff > 0 ? `+${diff}` : diff}
        </text>
      )}
    </g>
  );
};

const ChartTooltip = ({
  active,
  label,
  chartData,
  youScore,
  maxScore,
}: CustomTooltipProps) => {
  if (!active || !label) return null;

  const data = chartData.find((d) => d.label === label);
  if (!data) return null;

  const score = data.count;
  const isYou = data.label === "YOU";
  const rate = ((score / maxScore) * 100).toFixed(2);
  const diff = score - youScore;

  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-surface/90 p-3 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] tracking-widest text-bpim-primary">
          {isYou ? `BPI: ${data.bpi.toFixed(2)}` : `TARGET BPI: ${data.label}`}
        </p>
        <Separator className="bg-bpim-overlay/60" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold text-bpim-text">Score: {score}</p>
          <p className="text-[10px] text-bpim-muted">Rate: {rate}%</p>
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
      const getVal = (d: ChartDataItem) =>
        d.label === "YOU" ? d.bpi : parseFloat(d.label);
      return getVal(b) - getVal(a);
    });
  }, [data]);

  const youScore = useMemo(
    () => data.find((d) => d.label === "YOU")?.count ?? 0,
    [data],
  );

  const yMin = useMemo(() => {
    const kaidenAvg = data.find((d) => d.label === "0")?.count ?? 0;
    return Math.max(0, Math.floor(kaidenAvg - maxScore * 0.08));
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
    <div className="h-85 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top:36,right: 16, left: 16 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.muted, fontSize: 10, fontWeight: "bold" }}
            interval={0}
          />
          <YAxis domain={[yMin, maxScore]} hide />

          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                label={props.label}
                chartData={chartData}
                youScore={youScore}
                maxScore={maxScore}
              />
            )}
            cursor={{ fill: c.primaryRgba(0.04) }}
            isAnimationActive={false}
          />

          {borders.map((b) => (
            <ReferenceLine
              key={b.label}
              y={b.score}
              stroke={c.warning}
              strokeOpacity={0.2}
              strokeDasharray="4 4"
            >
              <RechartsLabel
                value={b.label}
                position="insideBottomRight"
                fill={c.warning}
                fontSize={9}
                fontWeight="black"
                dx={20}
              />
            </ReferenceLine>
          ))}

          <Bar
            dataKey="count"
            shape={<CustomBarShape c={c} />}
            animationDuration={800}
          >
            <LabelList
              dataKey="count"
              content={(props) => (
                <DataLabel
                  x={props.x}
                  y={props.y}
                  width={props.width}
                  index={props.index}
                  chartData={chartData}
                  youScore={youScore}
                />
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
