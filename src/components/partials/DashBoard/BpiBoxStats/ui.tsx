import { useEffect, useMemo, useState } from "react";
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

interface ExtendedBpiBoxStatsItem extends BpiBoxStatsItem {
  efficiency?: number;
}

interface ChartDataPoint extends ExtendedBpiBoxStatsItem {
  totalBpiBandBase: number;
  totalBpiBandHeight: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
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
          <span className="font-bold text-bpim-primary">
            上位25-75%帯（塗りつぶし）
          </span>
          : 期間中更新した楽曲におけるBPIの厚みを示します。
          <ul className="list-none pl-4 mt-1 space-y-1 text-bpim-muted">
            <li>
              ・<span className="italic">帯の「上端」</span>
              ：上位25%の更新に絞った場合の期間総合BPI。ここが高い時は激ウマリザルトがあったことを示します。
            </li>
          </ul>
        </li>
        <li>
          <span className="font-bold text-bpim-warning">
            打鍵効率（右軸：点線）
          </span>
          : 総打鍵数に対する、更新スコアのノーツ数の割合です。
          <span className="text-bpim-warning">
            「効率が高い＝その日にプレイした多くの楽曲で、高い割合でスコアを伸ばすことができた日」
          </span>
          と分析できます。
        </li>
        <li>
          <span className="font-bold">上限/下限（点線）</span>: その期間における
          <u>単曲</u>
          の最高・最低BPI。上限が跳ねている日は「一発の最大火力」が出た日を意味します。
        </li>
      </ul>
    </section>

    <section className="bg-bpim-overlay/40 p-2 rounded text-[10px]">
      <p>
        打鍵効率は、プレー全体のボリュームに対する「リザルトの質」を可視化したものです。BPIの推移と併せて見ることで、自身のプレーサイクルの良し悪しを確認できます。
      </p>
    </section>
    <section className="bg-bpim-overlay/40 p-2 rounded text-[10px] space-y-1.5">
      <p className="flex items-start gap-1">
        <span className="text-bpim-danger font-bold">※</span>
        <span className="font-bold border-b border-bpim-danger/50">
          打鍵効率を表示するには、別途IIDXタワーデータの取り込みが必要です。
        </span>
      </p>
      <p className="text-bpim-muted italic">
        プレー曲数が少ない日は極端な値が出やすいため、推移を見る際は曲数も併せて確認することをおすすめします。
      </p>
    </section>
  </div>
);

const TITLE_MAP: Record<StatsGroupBy, string> = {
  day: "単日総合BPI 分布推移",
  week: "週間総合BPI 分布推移",
  month: "月間総合BPI 分布推移",
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
      {typeof value === "number" ? value.toFixed(2) : "0.00"}
    </span>
  </div>
);

const BpiBoxTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartDataPoint;

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
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-bpim-warning font-bold">
            打鍵効率
          </span>
          <span className="font-mono text-xs text-bpim-warning font-bold">
            {d.efficiency?.toFixed(1)}%
          </span>
        </div>
        <p className="text-right text-[10px] text-bpim-muted">
          集計対象: {d.count}曲
        </p>
      </div>
    </div>
  );
};

export const BpiBoxStatsChart = ({
  data,
  isLoading,
  groupBy,
  onGroupByChange,
}: {
  data?: ExtendedBpiBoxStatsItem[];
  isLoading: boolean;
  groupBy: StatsGroupBy;
  onGroupByChange: (g: StatsGroupBy) => void;
}) => {
  const c = useChartColors();
  const [visible, setVisible] = useState({
    median: true,
    band: true,
    minMax: false,
    efficiency: true,
  });

  useEffect(() => {
    if (!isLoading && data && data.length > 0) {
      const hasAnyEfficiency = data.some((d) => (d.efficiency ?? 0) > 0);
      setVisible((prev) => ({ ...prev, efficiency: hasAnyEfficiency }));
    }
  }, [data, isLoading]);

  const { chartData, ticks, startIndex } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], ticks: [], startIndex: 0 };

    const processed: ChartDataPoint[] = data.map((d) => ({
      ...d,
      totalBpiBandBase: d.totalBpiTop75,
      totalBpiBandHeight: d.totalBpiTop25 - d.totalBpiTop75,
    }));

    const interval = Math.max(1, Math.floor(processed.length / 10));
    const calculatedTicks = processed
      .filter((_, i) => i % interval === 0 || i === processed.length - 1)
      .map((d) => d.date);

    const windowSize = groupBy === "day" ? 30 : groupBy === "week" ? 26 : 12;

    return {
      chartData: processed,
      ticks: calculatedTicks,
      startIndex: Math.max(0, processed.length - windowSize),
    };
  }, [data, groupBy]);

  if (isLoading) return <BpiBoxStatsSkeleton />;
  if (!data || chartData.length === 0) return null;

  return (
    <DashCard className="h-105 flex flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-1 shrink-0">
          <h3 className="text-sm font-bold uppercase text-bpim-muted">
            {TITLE_MAP[groupBy]}
          </h3>
          <HelpTooltip>{HelpText}</HelpTooltip>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="flex overflow-hidden rounded border border-bpim-border bg-bpim-surface">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onGroupByChange(v)}
                className={`px-2 py-0.5 text-[10px] transition-colors ${
                  groupBy === v
                    ? "bg-bpim-primary text-bpim-surface"
                    : "text-bpim-muted hover:bg-bpim-overlay"
                }`}
              >
                {v === "day" ? "単日" : v === "week" ? "週間" : "月間"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-[10px] text-bpim-muted">
            <button
              onClick={() =>
                setVisible((v) => ({ ...v, efficiency: !v.efficiency }))
              }
              className={`flex items-center gap-1 transition-opacity ${visible.efficiency ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-px w-3 border-t border-dashed border-bpim-warning" />{" "}
              打鍵効率(%)
            </button>
            <button
              onClick={() => setVisible((v) => ({ ...v, median: !v.median }))}
              className={`flex items-center gap-1 transition-opacity ${visible.median ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-bpim-primary" />{" "}
              期間総合BPI
            </button>
            <button
              onClick={() => setVisible((v) => ({ ...v, band: !v.band }))}
              className={`flex items-center gap-1 transition-opacity ${visible.band ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-2 w-3 rounded-sm bg-bpim-primary opacity-20" />{" "}
              上位25-75%帯
            </button>
            <button
              onClick={() => setVisible((v) => ({ ...v, minMax: !v.minMax }))}
              className={`flex items-center gap-1 transition-opacity ${visible.minMax ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-px w-3 border-t border-dashed border-bpim-muted" />{" "}
              上限/下限
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: -10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={(v) => v.split("-").slice(1).join("/")}
              stroke={c.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              yAxisId="left"
              domain={["auto", "auto"]}
              stroke={c.muted}
              fontSize={10}
              tickFormatter={(v) => v.toFixed(0)}
              axisLine={false}
              tickLine={false}
              width={35}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              stroke={c.warning}
              fontSize={9}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
              hide={!visible.efficiency}
              width={40}
            />

            <Tooltip content={<BpiBoxTooltip />} cursor={{ stroke: c.grid }} />

            {visible.efficiency && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="efficiency"
                stroke={c.warning}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={{ r: 2, fill: c.warning }}
                connectNulls
                animationDuration={1000}
              />
            )}

            {visible.band && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalBpiBandBase"
                fill="transparent"
                stroke="none"
                stackId="band"
                connectNulls
                isAnimationActive={false}
              />
            )}
            {visible.band && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalBpiBandHeight"
                fill={c.primary}
                fillOpacity={0.15}
                stroke="none"
                stackId="band"
                connectNulls
              />
            )}

            {visible.minMax && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="max"
                stroke={c.muted}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
            )}
            {visible.minMax && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="min"
                stroke={c.muted}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
            )}

            {visible.median && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalBpi"
                stroke={c.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
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
