

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useTranslation } from "@/hooks/common/useTranslation";


import { SKILL_COLOR, ChartPoint } from "@/components/partials/common/DashBoard/Dialogs/RatchetHistory/types";
import { RatchetTooltip, RawDeltaBar } from "@/components/partials/common/DashBoard/Dialogs/RatchetHistory/tooltip";

export interface RatchetChartProps {
  isLoading: boolean;
  chartData: ChartPoint[];
  ticks: string[];
  startIndex: number;
  formatDate: (value: string, index: number) => string;
  rawLabel: string;
  ratchetedLabel: string;
  rawDeltaLabel: string;
  skillLabel: string;
  c: ReturnType<typeof useChartColors>;
  t: ReturnType<typeof useTranslation>["t"];
}

/** 総合BPIの推移（ラチェット前後・差分・潜在能力）の折れ線・棒グラフ。 */
export const RatchetChart = ({
  isLoading,
  chartData,
  ticks,
  startIndex,
  formatDate,
  rawLabel,
  ratchetedLabel,
  rawDeltaLabel,
  skillLabel,
  c,
  t,
}: RatchetChartProps) => {
  return (
    <div className="px-4 py-3 h-80">
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-bpim-muted">
          {t("common.noData")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
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
              domain={["dataMin - 1", "dataMax + 1"]}
              stroke={c.muted}
              fontSize={10}
              tickFormatter={(v) => v.toFixed(1)}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <YAxis yAxisId="delta" hide />
            <YAxis
              yAxisId="skill"
              orientation="right"
              domain={["dataMin - 0.2", "dataMax + 0.2"]}
              stroke={SKILL_COLOR}
              fontSize={10}
              tickFormatter={(v) => v.toFixed(1)}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              content={(props) => (
                <RatchetTooltip
                  active={props.active}
                  payload={
                    props.payload as
                      | ReadonlyArray<{ payload: ChartPoint }>
                      | undefined
                  }
                  label={props.label}
                  rawLabel={rawLabel}
                  ratchetedLabel={ratchetedLabel}
                  rawDeltaLabel={rawDeltaLabel}
                  skillLabel={skillLabel}
                />
              )}
              cursor={{ stroke: c.grid }}
            />
            <Bar
              yAxisId="delta"
              dataKey="rawDelta"
              barSize={4}
              shape={
                <RawDeltaBar
                  successColor={c.success}
                  dangerColor={c.danger}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="raw"
              stroke={c.warning}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="ratcheted"
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
            <Line
              yAxisId="skill"
              type="monotone"
              dataKey="skill"
              stroke={SKILL_COLOR}
              strokeWidth={1.5}
              strokeDasharray="1 3"
              dot={false}
              connectNulls
              animationDuration={800}
            />
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
      )}
    </div>

  );
};
