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
import type { StatsGroupBy, BpiBoxStatsItem } from "@/types/stats/bpiBoxStats";
import { BpiBoxStatsSkeleton } from "./skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import { HelpTooltip } from "@/components/ui/tooltip";

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

const HelpText = (
  <div className="space-y-3">
    <section>
      <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
        統計の対象
      </p>
      <p>
        選択した期間（単日・週間・月間）内に
        <span className="text-bpim-warning">新規更新・登録されたスコア</span>
        のみを対象に集計しています。全曲の累積データではないため、その時の「調子」や「地力の密度」がダイレクトに反映されます。
      </p>
    </section>

    <section>
      <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
        各項目の意味
      </p>
      <ul className="list-disc list-inside space-y-1.5">
        <li>
          <span className="font-bold">期間総合BPI</span>:
          その期間の平均的な実力。これが右肩上がりなら、継続的に高い水準でプレーできている証拠です。
        </li>
        <li>
          <span className="font-bold">上位25-75%帯（塗りつぶし）</span>:
          全曲のうち、真ん中半分のスコアが収まっている範囲です。この帯が
          <span className="text-bpim-warning">
            「高い位置にある＝高難易度の地力が高い」「幅が狭い＝実力が安定している」
          </span>
          ことを示します。
        </li>
        <li>
          <span className="font-bold">上限/下限（点線）</span>:
          その期間の最高・最低BPI。上限が跳ねている日は「一発の最大火力」が出た日、下限が高い日は「苦手曲でも底上げができている」ことを意味します。
        </li>
      </ul>
    </section>

    <section className="bg-bpim-overlay/40 p-2 rounded text-[10px]">
      <p>
        プレー曲数が少ない日は極端な値が出やすいため、推移を見る際は曲数も併せて確認することをおすすめします。
      </p>
    </section>
  </div>
);

const BpiBoxTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="min-w-45 rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <p className="mb-2 text-[10px] font-bold text-bpim-muted">{label}</p>
      <div className="flex flex-col gap-1">
        <Row label="上限" value={d.max} color="text-bpim-danger" />
        <Row
          label="上位25%総合"
          value={d.totalBpiTop25}
          color="text-bpim-warning"
        />
        <Row
          label="期間総合BPI"
          value={d.totalBpi}
          color="text-bpim-primary"
          bold
        />
        <Row
          label="上位75%総合"
          value={d.totalBpiTop75}
          color="text-bpim-warning"
        />
        <Row label="下限" value={d.min} color="text-bpim-success" />
        <div className="my-1 h-px w-full bg-bpim-overlay/60" />
        <p className="text-right text-[10px] text-bpim-muted">
          集計対象: {d.count}曲
        </p>
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

const GROUP_BY_OPTIONS: { value: StatsGroupBy; label: string }[] = [
  { value: "day", label: "単日" },
  { value: "week", label: "週間" },
  { value: "month", label: "月間" },
];

const TITLE_MAP: Record<StatsGroupBy, string> = {
  day: "単日総合BPI 分布推移",
  week: "週間総合BPI 分布推移",
  month: "月間総合BPI 分布推移",
};

const DEFAULT_WINDOW: Record<StatsGroupBy, number> = {
  day: 30,
  week: 26,
  month: 12,
};

interface BpiBoxStatsChartProps {
  data?: BpiBoxStatsItem[];
  isLoading: boolean;
  groupBy: StatsGroupBy;
  onGroupByChange: (g: StatsGroupBy) => void;
}

export const BpiBoxStatsChart = ({
  data,
  isLoading,
  groupBy,
  onGroupByChange,
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
      startIndex: Math.max(0, processed.length - DEFAULT_WINDOW[groupBy]),
    };
  }, [data, groupBy]);

  if (isLoading) return <BpiBoxStatsSkeleton />;
  if (chartData.length === 0) return null;

  const formatDate = (value: string, index: number) => {
    if (groupBy === "month") {
      const [year, month] = value.split("-");
      const prevYear = ticks[index - 1]?.split("-")[0];
      return index === 0 || year !== prevYear
        ? `${year}/${parseInt(month)}`
        : `${parseInt(month)}月`;
    }
    const date = new Date(value);
    return index === 0 ||
      date.getFullYear() !== new Date(ticks[index - 1] ?? value).getFullYear()
      ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <DashCard className="h-105">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-1 shrink-0">
          <h3 className="text-sm font-bold uppercase text-bpim-muted">
            {TITLE_MAP[groupBy]}
          </h3>
          <HelpTooltip>{HelpText}</HelpTooltip>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="flex overflow-hidden rounded border border-bpim-border bg-bpim-surface">
            {GROUP_BY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onGroupByChange(value)}
                className={`px-2 py-0.5 text-[10px] transition-colors ${
                  groupBy === value
                    ? "bg-bpim-primary text-bpim-surface"
                    : "text-bpim-muted hover:bg-bpim-overlay"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-[10px] text-bpim-muted">
            <button
              onClick={() => toggleVisibility("median")}
              className={`flex items-center gap-1 whitespace-nowrap transition-opacity ${visible.median ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-bpim-primary" />
              期間総合BPI
            </button>

            <button
              onClick={() => toggleVisibility("band")}
              className={`flex items-center gap-1 whitespace-nowrap transition-opacity ${visible.band ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-2 w-3 rounded-sm bg-bpim-primary opacity-20" />
              上位25–75%帯
            </button>

            <button
              onClick={() => toggleVisibility("minMax")}
              className={`flex items-center gap-1 whitespace-nowrap transition-opacity ${visible.minMax ? "opacity-100" : "opacity-40"}`}
            >
              <span
                className="inline-block h-px w-3"
                style={{ borderTop: `1px dashed ${c.muted}` }}
              />
              上限/下限
            </button>
          </div>
        </div>
      </div>

      <div className="h-[80%] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
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
              minTickGap={20}
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
              width={35}
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
              height={20}
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
