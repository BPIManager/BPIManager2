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
import { useTranslation } from "@/hooks/common/useTranslation";

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

const BpiBoxHelpContent = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.bpiBoxStats.help.scopeTitle")}
        </p>
        <p>
          {t("dashboard.bpiBoxStats.help.scopeBefore")}
          <span className="text-bpim-warning">{t("dashboard.bpiBoxStats.help.scopeHighlight")}</span>
          {t("dashboard.bpiBoxStats.help.scopeAfter")}
        </p>
      </section>

      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.bpiBoxStats.help.itemsTitle")}
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <span className="font-bold">{t("dashboard.bpiBoxStats.help.periodBpiLabel")}</span>:
            {t("dashboard.bpiBoxStats.help.periodBpiDesc")}
          </li>
          <li>
            <span className="font-bold text-bpim-primary">
              {t("dashboard.bpiBoxStats.help.bandLabel")}
            </span>
            : {t("dashboard.bpiBoxStats.help.bandDesc")}
            <ul className="list-none pl-4 mt-1 space-y-1 text-bpim-muted">
              <li>
                ・<span className="italic">{t("dashboard.bpiBoxStats.help.bandTopLabel")}</span>
                ：{t("dashboard.bpiBoxStats.help.bandTopDesc")}
              </li>
            </ul>
          </li>
          <li>
            <span className="font-bold text-bpim-warning">
              {t("dashboard.bpiBoxStats.help.efficiencyLabel")}
            </span>
            : {t("dashboard.bpiBoxStats.help.efficiencyDesc")}
            <span className="text-bpim-warning">
              {t("dashboard.bpiBoxStats.help.efficiencyHighlight")}
            </span>
            {t("dashboard.bpiBoxStats.help.efficiencyAfter")}
          </li>
          <li>
            <span className="font-bold">{t("dashboard.bpiBoxStats.help.minMaxLabel")}</span>: {t("dashboard.bpiBoxStats.help.minMaxDesc")}
          </li>
        </ul>
      </section>

      <section className="bg-bpim-overlay/40 p-2 rounded text-[10px]">
        <p>{t("dashboard.bpiBoxStats.help.note1")}</p>
      </section>
      <section className="bg-bpim-overlay/40 p-2 rounded text-[10px] space-y-1.5">
        <p className="flex items-start gap-1">
          <span className="text-bpim-danger font-bold">※</span>
          <span className="font-bold border-b border-bpim-danger/50">
            {t("dashboard.bpiBoxStats.help.warningLabel")}
          </span>
        </p>
        <p className="text-bpim-muted italic">
          {t("dashboard.bpiBoxStats.help.note2")}
        </p>
      </section>
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
      {typeof value === "number" ? value.toFixed(2) : "0.00"}
    </span>
  </div>
);

const BpiBoxTooltip = ({ active, payload, label }: TooltipProps) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartDataPoint;

  return (
    <div className="min-w-45 rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <p className="mb-2 text-[10px] font-bold text-bpim-muted">{label}</p>
      <div className="flex flex-col gap-1">
        <Row label={t("dashboard.bpiBoxStats.upper")} value={d.max} color="text-bpim-danger" />
        <Row
          label={t("dashboard.bpiBoxStats.top25")}
          value={d.totalBpiTop25}
          color="text-bpim-warning"
        />
        <Row
          label={t("dashboard.bpiBoxStats.periodBpi")}
          value={d.totalBpi}
          color="text-bpim-primary"
          bold
        />
        <Row
          label={t("dashboard.bpiBoxStats.top75")}
          value={d.totalBpiTop75}
          color="text-bpim-warning"
        />
        <Row label={t("dashboard.bpiBoxStats.lower")} value={d.min} color="text-bpim-success" />
        <div className="my-1 h-px w-full bg-bpim-overlay/60" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-bpim-warning font-bold">
            {t("dashboard.bpiBoxStats.efficiency")}
          </span>
          <span className="font-mono text-xs text-bpim-warning font-bold">
            {d.efficiency?.toFixed(1)}%
          </span>
        </div>
        <p className="text-right text-[10px] text-bpim-muted">
          {t("dashboard.bpiBoxStats.count")}: {d.count}{t("dashboard.songUnit")}
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
  const { t } = useTranslation();
  const [visible, setVisible] = useState({
    median: true,
    band: true,
    minMax: false,
    efficiency: true,
  });

  const TITLE_MAP: Record<StatsGroupBy, string> = {
    day: t("dashboard.bpiBoxStats.titleDay"),
    week: t("dashboard.bpiBoxStats.titleWeek"),
    month: t("dashboard.bpiBoxStats.titleMonth"),
  };

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
          <HelpTooltip><BpiBoxHelpContent /></HelpTooltip>
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
                {v === "day"
                  ? t("dashboard.bpiHistory.day")
                  : v === "week"
                    ? t("dashboard.bpiHistory.week")
                    : t("dashboard.bpiHistory.month")}
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
              {t("dashboard.bpiBoxStats.efficiencyPct")}
            </button>
            <button
              onClick={() => setVisible((v) => ({ ...v, median: !v.median }))}
              className={`flex items-center gap-1 transition-opacity ${visible.median ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-bpim-primary" />{" "}
              {t("dashboard.bpiBoxStats.periodBpi")}
            </button>
            <button
              onClick={() => setVisible((v) => ({ ...v, band: !v.band }))}
              className={`flex items-center gap-1 transition-opacity ${visible.band ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-2 w-3 rounded-sm bg-bpim-primary opacity-20" />{" "}
              {t("dashboard.bpiBoxStats.band2575")}
            </button>
            <button
              onClick={() => setVisible((v) => ({ ...v, minMax: !v.minMax }))}
              className={`flex items-center gap-1 transition-opacity ${visible.minMax ? "opacity-100" : "opacity-40"}`}
            >
              <span className="inline-block h-px w-3 border-t border-dashed border-bpim-muted" />{" "}
              {t("dashboard.bpiBoxStats.minMax")}
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
