"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
  CartesianGrid,
  Dot,
} from "recharts";
import {
  BookOpen,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BpiCalculator } from "@/lib/bpi";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useSongDefinitions } from "@/hooks/score/useSongDefinitions";
import { SongWithScore } from "@/types/songs/score";
import dayjs from "@/lib/dayjs";

interface DefinitionsTabProps {
  song: SongWithScore;
}

interface ChartPoint {
  defId: number;
  label: string;
  bpi: number | null;
  wrScore: number;
  kaidenAvg: number;
  coef: number | null;
  isCurrent: number | null;
}

interface DefTooltipProps extends TooltipProps<number, string> {
  points: ChartPoint[];
  exScore: number;
  notes: number;
  label: string;
}

const DefTooltip = ({
  active,
  label,
  points,
  exScore,
  notes,
}: DefTooltipProps) => {
  if (!active || !label) return null;
  const point = points.find((p) => p.label === label);
  if (!point) return null;

  const maxScore = notes * 2;
  const rate = ((exScore / maxScore) * 100).toFixed(1);

  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-surface/95 p-3 shadow-2xl backdrop-blur-md min-w-[160px]">
      <div className="flex items-center gap-1.5 mb-2">
        {point.isCurrent === 1 && (
          <span className="text-[9px] font-black tracking-widest text-bpim-primary uppercase">
            CURRENT
          </span>
        )}
        <span className="text-[10px] font-mono text-bpim-muted">
          {point.label}
        </span>
      </div>
      <Separator className="bg-bpim-overlay/60 mb-2" />
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-bpim-muted">BPI</span>
          <span className="font-mono text-sm font-black text-bpim-primary">
            {point.bpi !== null ? point.bpi.toFixed(2) : "—"}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-bpim-muted">EX Score</span>
          <span className="font-mono text-xs font-bold text-bpim-text">
            {exScore}
            <span className="text-[9px] text-bpim-muted ml-1">{rate}%</span>
          </span>
        </div>
        <Separator className="bg-bpim-overlay/40 my-0.5" />
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-bpim-muted">WR</span>
          <span className="font-mono text-xs text-bpim-text">
            {point.wrScore}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[10px] text-bpim-muted">Avg</span>
          <span className="font-mono text-xs text-bpim-text">
            {point.kaidenAvg}
          </span>
        </div>
      </div>
    </div>
  );
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { isCurrent?: number };
  c: { warning: string; primary: string };
}

const CustomDot = (props: CustomDotProps) => {
  const { cx, cy, payload, c } = props;
  if (!payload) return null;
  const isCurrent = payload.isCurrent === 1;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isCurrent ? 6 : 3.5}
      fill={isCurrent ? c.warning : c.primary}
      stroke={isCurrent ? c.warning : c.primary}
      strokeWidth={isCurrent ? 2 : 1}
      fillOpacity={isCurrent ? 1 : 0.7}
    />
  );
};

export const DefinitionsTab = ({ song }: DefinitionsTabProps) => {
  const { definitions, isLoading, isError } = useSongDefinitions(song.songId);
  const c = useChartColors();

  const defaultEx = song.exScore ?? 0;
  const [inputValue, setInputValue] = useState<string>(String(defaultEx));

  const exScore = useMemo(() => {
    const parsed = parseInt(inputValue, 10);
    const maxScore = song.notes * 2;
    if (isNaN(parsed) || parsed < 0) return 0;
    if (parsed > maxScore) return maxScore;
    return parsed;
  }, [inputValue, song.notes]);

  const maxScore = song.notes * 2;

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (!definitions) return [];
    return definitions
      .map((def) => {
        const bpi = BpiCalculator.calc(exScore, {
          notes: song.notes,
          wrScore: def.wrScore,
          kaidenAvg: def.kaidenAvg,
          coef: def.coef,
        });
        return {
          defId: def.defId,
          label: dayjs(def.updatedAt).format("YY/MM/DD"),
          bpi: bpi !== null && !isNaN(bpi) ? Math.round(bpi * 100) / 100 : null,
          wrScore: def.wrScore,
          kaidenAvg: def.kaidenAvg,
          coef: def.coef,
          isCurrent: def.isCurrent,
        };
      })
      .reverse();
  }, [definitions, exScore, song.notes]);

  const bpiTrend = useMemo(() => {
    const valid = chartPoints.filter((p) => p.bpi !== null);
    if (valid.length < 2) return null;
    const oldest = valid[0].bpi!;
    const newest = valid[valid.length - 1].bpi!;
    return Math.round((newest - oldest) * 100) / 100;
  }, [chartPoints]);

  const currentBpi = useMemo(() => {
    const current = chartPoints.find((p) => p.isCurrent === 1);
    return current?.bpi ?? chartPoints[chartPoints.length - 1]?.bpi ?? null;
  }, [chartPoints]);

  const yDomain = useMemo(() => {
    const bpis = chartPoints
      .map((p) => p.bpi)
      .filter((b): b is number => b !== null);
    if (bpis.length === 0) return [-15, 100];
    const min = Math.min(...bpis);
    const max = Math.max(...bpis);
    const pad = Math.max(5, (max - min) * 0.2);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [chartPoints]);

  if (isLoading) {
    return (
      <SectionLoader className="h-64" />
    );
  }

  if (isError || !definitions || definitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <BookOpen className="h-10 w-10 text-bpim-subtle" />
        <p className="text-sm font-medium text-bpim-muted">
          定義データが見つかりません
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              EXスコア
            </label>
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              min={0}
              max={maxScore}
              className="h-8 font-mono text-sm font-bold border-bpim-border bg-bpim-bg/40 text-bpim-text focus-visible:ring-bpim-primary"
            />
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              現在の定義
            </span>
            <span
              className={cn(
                "font-mono text-xl font-black leading-none",
                currentBpi !== null && currentBpi >= 0
                  ? "text-bpim-primary"
                  : "text-bpim-danger",
              )}
            >
              {currentBpi !== null ? currentBpi.toFixed(2) : "—"}
            </span>
            {bpiTrend !== null && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-bold",
                  bpiTrend > 0
                    ? "text-bpim-success"
                    : bpiTrend < 0
                      ? "text-bpim-danger"
                      : "text-bpim-muted",
                )}
              >
                {bpiTrend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : bpiTrend < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {bpiTrend > 0 ? "+" : ""}
                {bpiTrend}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartPoints}
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={c.mutedRgba(0.15)}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: c.muted, fontSize: 9, fontWeight: "bold" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: c.muted, fontSize: 9, fontWeight: "bold" }}
              width={28}
            />
            <Tooltip
              content={(props) => (
                <DefTooltip
                  points={chartPoints}
                  exScore={exScore}
                  notes={song.notes}
                  label={String(props.label || "")}
                />
              )}
              cursor={{ stroke: c.mutedRgba(0.3), strokeDasharray: "4 4" }}
              isAnimationActive={false}
            />
            <ReferenceLine
              y={0}
              stroke={c.warningRgba(0.4)}
              strokeDasharray="4 4"
              label={{
                value: "BPI 0",
                position: "insideBottomRight",
                fill: c.warning,
                fontSize: 9,
                fontWeight: "bold",
              }}
            />
            <Line
              type="monotone"
              dataKey="bpi"
              stroke={c.primary}
              strokeWidth={2}
              dot={(props) => <CustomDot {...props} c={c} />}
              activeDot={{ r: 6, fill: c.warning, stroke: c.warning }}
              connectNulls
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[28svh] overflow-y-auto pr-1 custom-scrollbar">
        {[...chartPoints].reverse().map((point) => {
          const isCurrent = point.isCurrent === 1;
          const bpiVal = point.bpi;

          return (
            <div
              key={point.defId}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                isCurrent
                  ? "border-bpim-primary/40 bg-bpim-primary-dim/20"
                  : "border-bpim-border bg-bpim-surface-2/40",
              )}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="text-[8px] font-black tracking-widest text-bpim-primary uppercase bg-bpim-primary/10 rounded px-1 py-0.5">
                      最新
                    </span>
                  )}
                  <span className="font-mono text-[10px] font-bold text-bpim-muted">
                    {point.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-bpim-muted/70">
                  <span>WR {point.wrScore}</span>
                  <span>·</span>
                  <span>Avg {point.kaidenAvg}</span>
                  <span>·</span>
                  <span>Coef {point.coef}</span>
                </div>
              </div>

              <span
                className={cn(
                  "font-mono text-base font-black",
                  bpiVal === null
                    ? "text-bpim-muted"
                    : bpiVal >= 0
                      ? isCurrent
                        ? "text-bpim-primary"
                        : "text-bpim-text"
                      : "text-bpim-danger",
                )}
              >
                {bpiVal !== null ? bpiVal.toFixed(2) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
