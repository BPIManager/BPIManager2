import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import type { BpiBoxStatsItem } from "@/types/stats/bpiBoxStats";
import { BpiBoxStatsSkeleton } from "./skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartDataPoint }>;
  label?: string;
}

interface ChartDataPoint extends BpiBoxStatsItem {
  bandBase: number;
  bandHeight: number;
  totalBpiBandBase: number;
  totalBpiBandHeight: number;
}

const BpiBoxTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="min-w-[180px] rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <p className="mb-2 text-[10px] font-bold text-bpim-muted">{label}</p>
      <div className="flex flex-col gap-1">
        <Row label="最大" value={d.max} color="text-bpim-danger" />
        <Row
          label="上位25%総合"
          value={d.totalBpiTop25}
          color="text-bpim-warning"
        />
        <Row
          label="総合BPI"
          value={d.totalBpi}
          color="text-bpim-primary"
          bold
        />
        <Row
          label="上位75%総合"
          value={d.totalBpiTop75}
          color="text-bpim-warning"
        />
        <Row label="最小" value={d.min} color="text-bpim-success" />
        <div className="my-1 h-px w-full bg-bpim-overlay/60" />
        <p className="text-right text-[10px] text-bpim-muted">{d.count}曲</p>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className={`text-[10px] ${color}`}>{label}</span>
    <span className={`font-mono text-xs ${color} ${bold ? "font-bold" : ""}`}>
      {value.toFixed(2)}
    </span>
  </div>
);

interface BpiBoxStatsChartProps {
  data?: BpiBoxStatsItem[];
  isLoading: boolean;
}

export const BpiBoxStatsChart = ({
  data,
  isLoading,
}: BpiBoxStatsChartProps) => {
  const c = useChartColors();
  const [visible, setVisible] = useState({
    median: true,
    band: true,
    minMax: false,
  });

  const toggleVisibility = (key: keyof typeof visible) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { chartData, ticks, startIndex } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], ticks: [], startIndex: 0 };

    const processed: ChartDataPoint[] = data.map((d) => ({
      ...d,
      bandBase: d.p25,
      bandHeight: d.p75 - d.p25,
      totalBpiBandBase: d.totalBpiTop75,
      totalBpiBandHeight: d.totalBpiTop25 - d.totalBpiTop75,
    }));

    const interval = Math.max(1, Math.floor(processed.length / 10));
    const calculatedTicks = processed
      .filter((_, i) => i % interval === 0 || i === processed.length - 1)
      .map((d) => d.date);

    return {
      chartData: processed,
      ticks: calculatedTicks,
      startIndex: Math.max(0, processed.length - 30),
    };
  }, [data]);

  if (isLoading) return <BpiBoxStatsSkeleton />;
  if (chartData.length === 0) return null;

  const formatDate = (value: string, index: number) => {
    const date = new Date(value);
    return index === 0 ||
      date.getFullYear() !== new Date(ticks[index - 1] ?? value).getFullYear()
      ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <DashCard className="h-[420px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          単日総合BPI 分布推移
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-bpim-muted">
          <button
            onClick={() => toggleVisibility("median")}
            className={`flex items-center gap-1 transition-opacity hover:opacity-80 ${visible.median ? "opacity-100" : "opacity-40"}`}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-bpim-primary" />
            総合BPI
          </button>

          <button
            onClick={() => toggleVisibility("band")}
            className={`flex items-center gap-1 transition-opacity hover:opacity-80 ${visible.band ? "opacity-100" : "opacity-40"}`}
          >
            <span className="inline-block h-2 w-3 rounded-sm bg-bpim-primary opacity-20" />
            上位25–75%帯
          </button>

          <button
            onClick={() => toggleVisibility("minMax")}
            className={`flex items-center gap-1 transition-opacity hover:opacity-80 ${visible.minMax ? "opacity-100" : "opacity-40"}`}
          >
            <span
              className="inline-block h-px w-3"
              style={{ borderTop: `1px dashed ${c.muted}` }}
            />
            最大/最小
          </button>
        </div>
      </div>

      <div className="h-[80%] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatDate}
              stroke={c.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={([dataMin, dataMax]: readonly [number, number]) => {
                const range = dataMax - dataMin;
                if (range === 0) return [dataMin - 5, dataMax + 5];
                const margin = range * 0.1;
                return [
                  Math.floor(dataMin - margin),
                  Math.ceil(dataMax + margin),
                ] as [number, number];
              }}
              stroke={c.muted}
              fontSize={10}
              tickFormatter={(v: number) => v.toFixed(0)}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={(props) => (
                <BpiBoxTooltip
                  active={props.active}
                  payload={
                    props.payload as
                      | ReadonlyArray<{ payload: ChartDataPoint }>
                      | undefined
                  }
                  label={props.label as string | undefined}
                />
              )}
              cursor={{ stroke: c.grid }}
            />
            {visible.band && (
              <>
                <Area
                  type="monotone"
                  dataKey="totalBpiBandBase"
                  fill="transparent"
                  stroke="none"
                  stackId="band"
                  connectNulls
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="totalBpiBandHeight"
                  fill={c.primary}
                  fillOpacity={0.15}
                  stroke="none"
                  stackId="band"
                  connectNulls
                  animationDuration={1000}
                />
              </>
            )}

            {visible.minMax && (
              <>
                <Line
                  type="monotone"
                  dataKey="max"
                  stroke={c.muted}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="min"
                  stroke={c.muted}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                  animationDuration={800}
                />
              </>
            )}

            {visible.median && (
              <Line
                type="monotone"
                dataKey="totalBpi"
                stroke={c.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: c.surface,
                  stroke: c.primary,
                  strokeWidth: 2,
                }}
                connectNulls
                animationDuration={1000}
              />
            )}

            <Brush
              dataKey="date"
              height={30}
              stroke={c.grid}
              fill={c.surface}
              startIndex={startIndex}
              tickFormatter={() => ""}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};
