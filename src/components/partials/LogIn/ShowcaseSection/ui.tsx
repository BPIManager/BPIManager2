import { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  BPI_HISTORY_MOCK,
  RADAR_MOCK_DATA,
  BPM_MOCK_DATA,
  BPI_DIST_MOCK,
  BPI_DIST_COUNTS,
  ACTIVITY_MOCK,
  ACTIVITY_COLORS,
  CHART_ANIMS,
  RIVAL_ROWS,
} from "./mocks";

export const MockBpiHistoryChart = () => {
  const c = useChartColors();
  const { t } = useTranslation();

  return (
    <DashCard className="h-65">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          {t("login.showcase.growth.chartTitle")}
        </h3>
      </div>
      <div className="h-48.75">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={BPI_HISTORY_MOCK}
            margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[10, 55]}
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => String(v)}
            />
            <YAxis yAxisId={1} hide domain={[0, 30]} />
            <Bar
              yAxisId={1}
              dataKey="count"
              barSize={4}
              fill={c.primary}
              opacity={0.2}
              radius={[2, 2, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="bpi"
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
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};

export const MockCurrentBpiCard = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
        {t("login.showcase.growth.cardTitle")}
      </span>
      <div className="mt-4 flex flex-row items-end gap-6">
        <span className="font-mono text-4xl font-bold tabular-nums leading-none tracking-tighter text-bpim-text">
          47.83
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
            {t("login.showcase.growth.rankLabel")}
          </span>
          <span className="text-lg font-bold text-bpim-text">
            ~62
            <span className="ml-1 text-xs font-normal text-bpim-muted">
              {t("login.showcase.growth.rankUnit")}
            </span>
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-bpim-primary/30 bg-bpim-primary/5 px-3 py-2">
        <span className="font-mono text-[10px] text-bpim-muted">
          2025-04-01
        </span>
        <span className="font-mono text-sm text-bpim-muted">38.21</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-sm font-bold text-bpim-success">
          <TrendingUp className="h-3 w-3" />
          +9.62
        </span>
      </div>
    </DashCard>
  );
};

export const MockRadarChart = () => {
  const c = useChartColors();
  const { t } = useTranslation();

  return (
    <DashCard>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          {t("login.showcase.weakness.radarTitle")}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-3 bg-bpim-primary" />
            <span className="text-[10px] text-bpim-primary">
              {t("login.showcase.weakness.me")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-3 border-t-2 border-dashed border-bpim-warning" />
            <span className="text-[10px] text-bpim-warning">
              {t("login.showcase.weakness.rival")}
            </span>
          </div>
        </div>
      </div>
      <div className="h-55">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="75%"
            data={RADAR_MOCK_DATA}
          >
            <PolarGrid stroke={c.grid} />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: c.muted, fontSize: 10, fontWeight: "bold" }}
            />
            <PolarRadiusAxis domain={[0, 80]} tick={false} axisLine={false} />
            <Radar
              name="YOU"
              dataKey="value"
              stroke={c.primary}
              strokeWidth={1.5}
              fill={c.primary}
              fillOpacity={0.25}
              dot={false}
              isAnimationActive
            />
            <Radar
              name="RIVAL"
              dataKey="rivalValue"
              stroke={c.warning}
              strokeWidth={1.5}
              fill={c.warning}
              fillOpacity={0.15}
              dot={false}
              isAnimationActive
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};

export const MockBpmBars = () => {
  const { t } = useTranslation();
  const BPI_MIN = -15;
  const scaleMax = 60;
  const range = scaleMax - BPI_MIN;

  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: CHART_ANIMS }} />
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        {t("login.showcase.weakness.bpmTitle")}
      </h3>
      <div className="flex flex-col gap-2.5">
        {BPM_MOCK_DATA.map((row, i) => {
          const myColor = getBpiColorStyle(row.myBpi).bg;
          const rivalColor = getBpiColorStyle(row.rivalBpi).bg;
          const myWidth = ((row.myBpi - BPI_MIN) / range) * 100;
          const rivalWidth = ((row.rivalBpi - BPI_MIN) / range) * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-15 shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                {row.label}
              </span>
              <div className="flex flex-1 flex-col gap-0.75">
                <div
                  className="h-2.25 rounded-r-sm"
                  style={{
                    width: `${myWidth}%`,
                    backgroundColor: myColor,
                    animation: `growWidth 0.5s ease-out ${i * 0.07}s both`,
                  }}
                />
                <div
                  className="h-2.25 rounded-r-sm opacity-45"
                  style={{
                    width: `${rivalWidth}%`,
                    backgroundColor: rivalColor,
                    animation: `growWidth 0.5s ease-out ${i * 0.07 + 0.03}s both`,
                  }}
                />
              </div>
              <div className="w-10 shrink-0">
                <span
                  className="text-[11px] font-bold"
                  style={{ color: myColor }}
                >
                  {row.myBpi}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};

export const MockBpiDistribution = () => {
  const { t } = useTranslation();
  const maxCount = Math.max(...BPI_DIST_COUNTS);

  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: CHART_ANIMS }} />
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        {t("login.showcase.dist.chartTitle")}
      </h3>
      <div className="flex h-35 items-end justify-between gap-0.75 px-1">
        {BPI_DIST_MOCK.map((item, i) => {
          const color = getBpiColorStyle(item.bpi).bg;
          const heightPct = (BPI_DIST_COUNTS[i] / maxCount) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="relative flex h-27.5 w-full flex-col justify-end">
                <div
                  className="w-full origin-bottom rounded-t-xs"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                    animation: `bounceGrow 0.6s ease-out ${i * 0.04}s both`,
                  }}
                />
              </div>
              <span
                className="mt-1 truncate text-[7px] font-bold text-bpim-muted"
                style={{ maxWidth: "100%" }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};

export const MockActivityCalendar = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <p className="mb-4 text-xs font-bold text-bpim-muted">
        {t("login.showcase.dist.calendarTitle")}
      </p>
      <div className="overflow-hidden">
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(7, 11px)",
            gridTemplateColumns: "repeat(20, 11px)",
            gridAutoFlow: "column",
            gap: "3px",
          }}
        >
          {ACTIVITY_MOCK.map((level, i) => (
            <div
              key={i}
              className="rounded-xs"
              style={{
                width: 11,
                height: 11,
                backgroundColor: ACTIVITY_COLORS[level],
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-bpim-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div
            key={v}
            className="h-2.5 w-2.5 rounded-xs"
            style={{ backgroundColor: ACTIVITY_COLORS[v] }}
          />
        ))}
        <span>More</span>
      </div>
    </DashCard>
  );
};

export const MockRivalBars = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          {t("login.showcase.rivals.chartTitle")}
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-bpim-primary" />
            <span className="text-bpim-primary">WIN</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-bpim-overlay" />
            <span className="text-bpim-muted">DRAW</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-bpim-danger" />
            <span className="text-bpim-danger">LOSE</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {RIVAL_ROWS.map((r, idx) => {
          const winRate = (r.win / r.total) * 100;
          const drawRate = (r.draw / r.total) * 100;
          const loseRate = (r.lose / r.total) * 100;
          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-bpim-text">
                  {r.name}
                </span>
                <span className="text-[10px] text-bpim-muted">
                  {r.total}
                  {t("login.showcase.rivals.compareUnit")}
                </span>
              </div>
              <div className="relative h-4.5 w-full overflow-hidden rounded-sm bg-bpim-surface-2/60">
                <div className="flex h-full w-full">
                  <div
                    className="relative h-full bg-bpim-primary"
                    style={{ width: `${winRate}%` }}
                  >
                    {winRate > 10 && (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {r.win}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="relative h-full bg-bpim-overlay"
                    style={{ width: `${drawRate}%` }}
                  />
                  <div
                    className="relative h-full flex-1 bg-bpim-danger"
                    style={{ width: `${loseRate}%` }}
                  >
                    {loseRate > 10 && (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {r.lose}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};

export const ShowcaseSection = ({
  tag,
  title,
  children,
  visual,
  flip = false,
}: {
  tag: string;
  title: string;
  children: ReactNode;
  visual: ReactNode;
  flip?: boolean;
}) => (
  <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-14">
    <div
      className={cn(
        "flex flex-col gap-4 lg:col-span-2",
        flip && "lg:order-last",
      )}
    >
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
        {tag}
      </span>
      <h3 className="text-xl font-bold leading-snug text-bpim-text md:text-2xl">
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-bpim-muted">
        {children}
      </div>
    </div>
    <div className={cn("lg:col-span-3", flip && "lg:order-first")}>
      {visual}
    </div>
  </div>
);
