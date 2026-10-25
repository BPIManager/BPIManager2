import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ListMusic, TrendingDown, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import dayjs from "@/lib/dayjs";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  compareMetric,
  movingAverage,
  type PerformanceMetric,
} from "@/utils/logs/getPerformanceComparison";
import type { PerformanceResponse } from "@/types/logs/performance";

const PAST_DAYS_OPTIONS = [7, 14, 30] as const;
const MOVING_AVERAGE_WINDOW = 5;

const formatTime = (ms: number) => dayjs(ms).tz().format("HH:mm");

const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}m` : `${m}m`;
};

const METRICS: {
  key: PerformanceMetric;
  labelKey:
    | "logs.perf.metric.songs"
    | "logs.perf.metric.playTime"
    | "logs.summary.batchBpi"
    | "logs.perf.metric.keys"
    | "logs.perf.metric.scratches";
  format: (v: number) => string;
  /** 小数を持つ指標の差分表示桁数 */
  digits: number;
}[] = [
  {
    key: "songCount",
    labelKey: "logs.perf.metric.songs",
    format: (v) => String(Math.round(v)),
    digits: 0,
  },
  {
    key: "playMinutes",
    labelKey: "logs.perf.metric.playTime",
    format: (v) => formatMinutes(v),
    digits: 0,
  },
  {
    key: "sessionBpi",
    labelKey: "logs.summary.batchBpi",
    format: (v) => v.toFixed(2),
    digits: 2,
  },
  {
    key: "keyCount",
    labelKey: "logs.perf.metric.keys",
    format: (v) => Math.round(v).toLocaleString(),
    digits: 0,
  },
  {
    key: "scratchCount",
    labelKey: "logs.perf.metric.scratches",
    format: (v) => Math.round(v).toLocaleString(),
    digits: 0,
  },
];

interface PerformanceViewProps {
  data: PerformanceResponse;
  /** 自分のページでのみ渡す。タワー未取込のときインポート導線を出す */
  onOpenTowerImport?: () => void;
  /** 更新楽曲タブを更新日時の降順で開く */
  onOpenSongs: () => void;
}

const PerformanceView = ({
  data,
  onOpenTowerImport,
  onOpenSongs,
}: PerformanceViewProps) => {
  const { t, tFormat } = useTranslation();
  const colors = useChartColors();
  const [pastDays, setPastDays] = useState<number>(7);

  const chartData = useMemo(() => {
    const ma = movingAverage(
      data.plays.map((p) => p.bpi),
      MOVING_AVERAGE_WINDOW,
    );
    return data.plays.map((p, i) => ({
      t: p.playedAt,
      title: p.title,
      bpi: p.bpi,
      ma: ma[i] === null ? null : Math.round((ma[i] as number) * 100) / 100,
    }));
  }, [data.plays]);

  const timeDomain = useMemo((): [number, number] | undefined => {
    if (data.plays.length === 0) return undefined;
    const min = data.plays[0].playedAt;
    const max = data.plays[data.plays.length - 1].playedAt;
    const pad = Math.max((max - min) * 0.03, 60_000);
    return [min - pad, max + pad];
  }, [data.plays]);

  if (data.plays.length === 0) {
    return (
      <DashCard className="p-6 text-center text-sm text-bpim-muted">
        {t("logs.perf.empty")}
      </DashCard>
    );
  }

  const showTowerPrompt = !data.hasTowerData && !!onOpenTowerImport;
  const visibleMetrics = METRICS.filter(
    (m) =>
      (m.key !== "keyCount" && m.key !== "scratchCount") || data.hasTowerData,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-bpim-muted">
          {tFormat("logs.perf.compare.label", { count: pastDays })}
        </span>
        <div className="flex items-center gap-1">
          {PAST_DAYS_OPTIONS.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={pastDays === n ? "default" : "outline"}
              className="h-7 rounded-full px-3 text-xs font-bold"
              onClick={() => setPastDays(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {visibleMetrics.map((m) => {
          const c = compareMetric(data.target, data.past, m.key, pastDays);
          const up = c.diff !== null && c.diff > 0;
          const down = c.diff !== null && c.diff < 0;
          const Icon = down ? TrendingDown : TrendingUp;
          return (
            <DashCard
              key={m.key}
              className="flex flex-col items-start justify-center gap-1 p-3 md:p-4"
            >
              <span className="text-sm font-bold tracking-tighter text-bpim-text">
                {t(m.labelKey)}
              </span>
              <span className="font-mono text-2xl font-bold leading-tight text-bpim-text">
                {c.value === null ? "-" : m.format(c.value)}
              </span>
              {c.average === null || c.diff === null ? (
                <span className="text-[10px] text-bpim-subtle">
                  {t("logs.perf.compare.none")}
                </span>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-bpim-muted">
                    {t("logs.perf.compare.avg")} {m.format(c.average)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-mono text-xs font-bold",
                      up && "text-bpim-primary",
                      down && "text-bpim-danger",
                      !up && !down && "text-bpim-muted",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {up ? "+" : ""}
                    {c.diff.toFixed(m.digits)}
                    {c.percent !== null && (
                      <span className="font-normal">
                        ({up ? "+" : ""}
                        {c.percent.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </DashCard>
          );
        })}
      </div>

      {showTowerPrompt && (
        <DashCard className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <p className="text-xs text-bpim-muted">{t("logs.perf.tower.missing")}</p>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full border-bpim-border text-xs font-bold"
            onClick={onOpenTowerImport}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            {t("logs.perf.tower.import")}
          </Button>
        </DashCard>
      )}

      <DashCard className="flex flex-col gap-3 p-4">
        <span className="text-sm font-bold text-bpim-text">
          {t("logs.perf.chart.title")}
        </span>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={timeDomain}
                tickFormatter={formatTime}
                tick={{ fill: colors.muted, fontSize: 10 }}
              />
              <YAxis
                tick={{ fill: colors.muted, fontSize: 10 }}
                width={32}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: colors.surface,
                  border: `1px solid ${colors.grid}`,
                  fontSize: 11,
                }}
                labelFormatter={(v) => formatTime(Number(v))}
                formatter={(value, name, item) => [
                  value as number,
                  name === "bpi"
                    ? `${t("logs.perf.chart.bpi")} (${(item.payload as { title: string }).title})`
                    : t("logs.perf.chart.ma"),
                ]}
              />
              <Line
                dataKey="bpi"
                stroke={colors.primary}
                strokeWidth={1}
                dot={{ r: 3, fill: colors.primary }}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                dataKey="ma"
                stroke={colors.warning}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-bpim-subtle">{t("logs.perf.note")}</p>
      </DashCard>

      <DashCard className="flex items-center p-4">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-bpim-border text-xs font-bold"
          onClick={onOpenSongs}
        >
          <ListMusic className="mr-2 h-3.5 w-3.5" />
          {t("logs.perf.openSongs")}
        </Button>
      </DashCard>
    </div>
  );
};

export default PerformanceView;
