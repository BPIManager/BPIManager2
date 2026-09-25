import { useMemo, useState } from "react";
import {
  ListMusicIcon,
  CalendarDaysIcon,
  ArrowDownWideNarrowIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Rectangle,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";
import type { BpiHistoryItem } from "@/types/stats/bpiHistory";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data?: BpiHistoryItem[];
  isLoading: boolean;
  groupBy: StatsGroupBy;
  onGroupByChange: (g: StatsGroupBy) => void;
}

// 潜在スキルa(実力指標)はBPIとスケールが異なるので専用の装飾色を使う(design-guidelines.md参照)
const SKILL_COLOR = "#a78bfa";

interface ChartPoint {
  date: string;
  raw: number;
  ratcheted: number;
  rawDelta: number;
  skill: number | null;
}

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartPoint }>;
  label?: string | number;
  rawLabel: string;
  ratchetedLabel: string;
  rawDeltaLabel: string;
  skillLabel: string;
}

const RatchetTooltip = ({
  active,
  payload,
  label,
  rawLabel,
  ratchetedLabel,
  rawDeltaLabel,
  skillLabel,
}: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const { raw, ratcheted, rawDelta, skill } = payload[0].payload;
  const gap = raw - ratcheted;

  return (
    <div className="min-w-45 rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <p className="mb-2 text-[10px] font-bold text-bpim-muted">{label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-bpim-warning">
            {rawLabel}
          </span>
          <span className="font-mono text-sm font-bold text-bpim-warning">
            {raw.toFixed(2)}
          </span>
        </div>
        {rawDelta !== 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-bpim-muted">{rawDeltaLabel}</span>
            <span
              className={cn(
                "font-mono text-xs font-bold",
                rawDelta > 0 ? "text-bpim-success" : "text-bpim-danger",
              )}
            >
              {rawDelta > 0 ? "+" : ""}
              {rawDelta.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-bpim-primary">
            {ratchetedLabel}
          </span>
          <span className="font-mono text-sm font-bold text-bpim-primary">
            {ratcheted.toFixed(2)}
          </span>
        </div>
        {gap < 0 && (
          <>
            <div className="my-1 h-px w-full bg-bpim-overlay/60" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-bpim-muted">gap</span>
              <span className="font-mono text-xs font-bold text-bpim-danger">
                {gap.toFixed(2)}
              </span>
            </div>
          </>
        )}
        {skill != null && (
          <>
            <div className="my-1 h-px w-full bg-bpim-overlay/60" />
            <div className="flex items-center justify-between gap-4">
              <span
                className="text-xs font-bold"
                style={{ color: SKILL_COLOR }}
              >
                {skillLabel}
              </span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: SKILL_COLOR }}
              >
                {skill.toFixed(3)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface RawDeltaBarProps {
  payload?: ChartPoint;
  successColor: string;
  dangerColor: string;
  [key: string]: unknown;
}

const RawDeltaBar = (props: RawDeltaBarProps) => {
  const { payload, successColor, dangerColor } = props;
  if (!payload || payload.rawDelta === 0) return null;
  const fill = payload.rawDelta > 0 ? successColor : dangerColor;
  return (
    <Rectangle {...props} fill={fill} opacity={0.6} radius={[1, 1, 1, 1]} />
  );
};

const GROUP_BY_VALUES: StatsGroupBy[] = ["day", "week", "month"];

interface HistoryStep {
  date: string;
  title: string;
  // 曲単位の場合のみ。日付単位では複数曲をまとめるため1曲分のスコアは表示しない
  newExScore?: number;
  newBpi?: number;
  rawAfter: number;
  // 比較対象の「直前」が存在しない(実質的な初回スコープ内プレイ/初日)場合はnull
  rawDelta: number | null;
  bestAfter: number;
  bestDelta: number | null;
  skillAfter: number | null;
  skillDelta: number | null;
}

type ListGranularity = "song" | "date";
type ContributionSortOrder = "date" | "impactDesc" | "impactAsc";

const MAX_HISTORY_STEPS = 300;

const RatchetHistoryDialog = ({
  isOpen,
  onOpenChange,
  data,
  isLoading,
  groupBy,
  onGroupByChange,
}: Props) => {
  const c = useChartColors();
  const { t, tFormat } = useTranslation();
  const [granularity, setGranularity] = useState<ListGranularity>("song");
  const [sortOrder, setSortOrder] = useState<ContributionSortOrder>("date");

  const rawLabel = t("dashboard.currentBpi.ratchetHistory.raw");
  const rawTotalLabel = t("dashboard.currentBpi.ratchetHistory.rawTotal");
  const ratchetedLabel = t("dashboard.currentBpi.ratchetHistory.ratcheted");
  const rawDeltaLabel = t("dashboard.currentBpi.ratchetHistory.rawDelta");
  const skillLabel = t("dashboard.currentBpi.ratchetHistory.latentSkill");

  const GROUP_BY_OPTIONS: { value: StatsGroupBy; label: string }[] =
    GROUP_BY_VALUES.map((value) => ({
      value,
      label: t(`dashboard.bpiHistory.${value}`),
    }));

  const { chartData, ticks, startIndex, latestGap } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], ticks: [], startIndex: 0, latestGap: null };

    const merged: ChartPoint[] = data.map((d, i) => ({
      date: d.date,
      raw: d.rawTotalBpi,
      ratcheted: d.totalBpi,
      rawDelta: i === 0 ? 0 : d.rawTotalBpi - data[i - 1].rawTotalBpi,
      skill: d.latentSkill,
    }));

    const interval = Math.max(1, Math.floor(merged.length / 10));
    const calculatedTicks = merged
      .filter((_, i) => i % interval === 0 || i === merged.length - 1)
      .map((d) => d.date);

    const last = merged[merged.length - 1];
    const gap = last ? last.raw - last.ratcheted : null;

    return {
      chartData: merged,
      ticks: calculatedTicks,
      startIndex: Math.max(0, merged.length - 30),
      latestGap: gap,
    };
  }, [data]);

  const songStepsResult = useMemo(() => {
    if (!data || data.length === 0)
      return {
        steps: [] as HistoryStep[],
        truncated: false,
        maxAbsRawDelta: 0,
      };
    const steps: HistoryStep[] = [];
    // updatedSongsの各要素はバックエンドが時系列順に計算した実測値。直近件数のみ計算しているため対象外はスキップ
    for (const item of data) {
      for (const song of item.updatedSongs) {
        if (song.rawTotalBpiAfter === undefined) continue;
        steps.push({
          date: item.date,
          title: song.title,
          newExScore: song.newExScore,
          newBpi: song.newBpi,
          rawAfter: song.rawTotalBpiAfter,
          rawDelta: song.rawTotalBpiDelta ?? null,
          bestAfter: song.totalBpiAfter ?? song.rawTotalBpiAfter,
          bestDelta: song.totalBpiDelta ?? null,
          skillAfter: song.latentSkillAfter ?? null,
          skillDelta: song.latentSkillDelta ?? null,
        });
      }
    }
    // 新しい→古い順(一番下が最も古い更新)
    steps.reverse();
    const truncated = steps.length > MAX_HISTORY_STEPS;
    const visible = truncated ? steps.slice(0, MAX_HISTORY_STEPS) : steps;
    const maxAbs = visible.reduce(
      (max, s) => Math.max(max, Math.abs(s.rawDelta ?? 0)),
      0,
    );
    return { steps: visible, truncated, maxAbsRawDelta: maxAbs };
  }, [data]);

  const dateStepsResult = useMemo(() => {
    if (!data || data.length === 0)
      return {
        steps: [] as HistoryStep[],
        truncated: false,
        maxAbsRawDelta: 0,
      };
    const steps: HistoryStep[] = [];
    // dataは既にgroupBy粒度で集計済みなので、隣同士の差分を取るだけで正確な変化になる(曲単位と違い全期間対象)
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.updatedSongs.length === 0) continue;
      const prev = i > 0 ? data[i - 1] : null;
      const songTitles = item.updatedSongs.map((s) => s.title);
      const title =
        songTitles.length <= 2
          ? songTitles.join(", ")
          : tFormat("dashboard.currentBpi.ratchetHistory.andMoreSongs", {
              titles: songTitles.slice(0, 2).join(", "),
              count: songTitles.length - 2,
            });
      steps.push({
        date: item.date,
        title,
        rawAfter: item.rawTotalBpi,
        rawDelta: prev ? item.rawTotalBpi - prev.rawTotalBpi : null,
        bestAfter: item.totalBpi,
        bestDelta: prev ? item.totalBpi - prev.totalBpi : null,
        skillAfter: item.latentSkill,
        skillDelta:
          prev && prev.latentSkill != null && item.latentSkill != null
            ? item.latentSkill - prev.latentSkill
            : null,
      });
    }
    steps.reverse();
    const truncated = steps.length > MAX_HISTORY_STEPS;
    const visible = truncated ? steps.slice(0, MAX_HISTORY_STEPS) : steps;
    const maxAbs = visible.reduce(
      (max, s) => Math.max(max, Math.abs(s.rawDelta ?? 0)),
      0,
    );
    return { steps: visible, truncated, maxAbsRawDelta: maxAbs };
  }, [data, tFormat]);

  const {
    steps: historySteps,
    truncated: historyStepsTruncated,
    maxAbsRawDelta,
  } = granularity === "song" ? songStepsResult : dateStepsResult;

  // 日付順(既定、historySteps自体が新しい→古い順)以外は総合BPIへの影響(rawDelta)で
  // 並べ替える。影響なし(rawDelta === null、初回スコープ内プレイ等)は常に末尾に残す
  const displaySteps = useMemo(() => {
    if (sortOrder === "date") return historySteps;
    const withDelta = historySteps.filter((s) => s.rawDelta !== null);
    const withoutDelta = historySteps.filter((s) => s.rawDelta === null);
    const sorted = [...withDelta].sort((a, b) =>
      sortOrder === "impactDesc"
        ? (b.rawDelta as number) - (a.rawDelta as number)
        : (a.rawDelta as number) - (b.rawDelta as number),
    );
    return [...sorted, ...withoutDelta];
  }, [historySteps, sortOrder]);

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
      date.getFullYear() !== new Date(ticks[index - 1]).getFullYear()
      ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden md:max-w-2xl md:max-h-[85svh]"
      >
        <DialogHeader className="shrink-0 border-b border-bpim-border px-4 pt-4 pb-3">
          <DialogTitle>
            {t("dashboard.currentBpi.ratchetHistory.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="shrink-0 px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex overflow-hidden rounded border border-bpim-border text-[10px]">
            {GROUP_BY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onGroupByChange(value)}
                className={cn(
                  "px-2 py-1 transition-colors",
                  groupBy === value
                    ? "bg-bpim-primary text-bpim-surface"
                    : "text-bpim-muted hover:bg-bpim-overlay",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-3 border-t-2 border-dashed border-bpim-warning bg-transparent" />
              <span className="text-xs font-medium text-bpim-warning">
                {rawLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-3 bg-bpim-primary" />
              <span className="text-xs font-medium text-bpim-primary">
                {ratchetedLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex h-2.5 w-3 items-end gap-0.5">
                <div className="h-full w-1 rounded-sm bg-bpim-success/60" />
                <div className="h-1 w-1 rounded-sm bg-bpim-danger/60" />
              </div>
              <span className="text-xs font-medium text-bpim-muted">
                {rawDeltaLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-0.5 w-3 border-t-2 border-dotted"
                style={{ borderColor: SKILL_COLOR }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: SKILL_COLOR }}
              >
                {skillLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 pt-3">
          {latestGap != null && latestGap < 0 ? (
            <div className="flex items-center justify-between rounded-lg border border-bpim-danger/30 bg-bpim-danger/5 px-3 py-2">
              <span className="text-[10px] font-bold text-bpim-muted">
                {t("dashboard.currentBpi.ratchetHistory.currentGap")}
              </span>
              <span className="font-mono text-sm font-bold text-bpim-danger">
                {latestGap.toFixed(2)}
              </span>
            </div>
          ) : (
            latestGap != null && (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-bpim-border/50 px-3 py-2">
                <span className="text-[10px] font-medium text-bpim-muted/70">
                  {t("dashboard.currentBpi.ratchetHistory.noGap")}
                </span>
              </div>
            )
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
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

          <div className="px-4 pb-4 pt-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-t border-bpim-border pt-3">
              <h4 className="text-xs font-bold text-bpim-text">
                {t("dashboard.currentBpi.ratchetHistory.contributionTitle")}
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded border border-bpim-border">
                  <Button
                    variant={sortOrder === "date" ? "default" : "ghost"}
                    size="icon-sm"
                    className="rounded-none"
                    title={t("dashboard.currentBpi.ratchetHistory.sortDate")}
                    onClick={() => setSortOrder("date")}
                  >
                    <ArrowDownWideNarrowIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant={sortOrder === "impactDesc" ? "default" : "ghost"}
                    size="icon-sm"
                    className="rounded-none"
                    title={t(
                      "dashboard.currentBpi.ratchetHistory.sortImpactPositive",
                    )}
                    onClick={() => setSortOrder("impactDesc")}
                  >
                    <TrendingUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant={sortOrder === "impactAsc" ? "default" : "ghost"}
                    size="icon-sm"
                    className="rounded-none"
                    title={t(
                      "dashboard.currentBpi.ratchetHistory.sortImpactNegative",
                    )}
                    onClick={() => setSortOrder("impactAsc")}
                  >
                    <TrendingDownIcon className="size-3.5" />
                  </Button>
                </div>
                <div className="flex overflow-hidden rounded border border-bpim-border">
                  <Button
                    variant={granularity === "song" ? "default" : "ghost"}
                    size="icon-sm"
                    className="rounded-none"
                    title={t("dashboard.currentBpi.ratchetHistory.granularitySong")}
                    onClick={() => setGranularity("song")}
                  >
                    <ListMusicIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant={granularity === "date" ? "default" : "ghost"}
                    size="icon-sm"
                    className="rounded-none"
                    title={t("dashboard.currentBpi.ratchetHistory.granularityDate")}
                    onClick={() => setGranularity("date")}
                  >
                    <CalendarDaysIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : displaySteps.length === 0 ? (
              <p className="text-xs text-bpim-muted">
                {t("dashboard.currentBpi.ratchetHistory.contributionEmpty")}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {displaySteps.map((step, i) => {
                  const hasDelta = step.rawDelta !== null;
                  // 線形幅だと外れ値1件に他が埋もれるため平方根スケールで圧縮する
                  const barPct =
                    hasDelta && maxAbsRawDelta > 0
                      ? (Math.sqrt(Math.abs(step.rawDelta as number)) /
                          Math.sqrt(maxAbsRawDelta)) *
                        100
                      : 0;
                  const isPositive = hasDelta && (step.rawDelta as number) > 0;
                  return (
                    <div
                      key={`${step.date}-${step.title}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface-2/60 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-bpim-text">
                          {step.title}
                        </p>
                        <p className="text-xs text-bpim-muted">{step.date}</p>
                        <p className="mt-0.5 font-mono text-xs text-bpim-muted">
                          {ratchetedLabel} {step.bestAfter.toFixed(2)}
                          {step.bestDelta != null && step.bestDelta !== 0 && (
                            <span
                              className={cn(
                                "ml-1 font-bold",
                                step.bestDelta > 0
                                  ? "text-bpim-success"
                                  : "text-bpim-danger",
                              )}
                            >
                              ({step.bestDelta > 0 ? "+" : ""}
                              {step.bestDelta.toFixed(2)})
                            </span>
                          )}
                        </p>
                        {step.skillAfter != null && (
                          <p
                            className="mt-0.5 font-mono text-xs"
                            style={{ color: SKILL_COLOR }}
                          >
                            {skillLabel} {step.skillAfter.toFixed(3)}
                            {step.skillDelta != null &&
                              step.skillDelta !== 0 && (
                                <span
                                  className={cn(
                                    "ml-1 font-bold",
                                    step.skillDelta > 0
                                      ? "text-bpim-success"
                                      : "text-bpim-danger",
                                  )}
                                >
                                  ({step.skillDelta > 0 ? "+" : ""}
                                  {step.skillDelta.toFixed(3)})
                                </span>
                              )}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {step.newExScore !== undefined && step.newBpi !== undefined && (
                          <span className="font-mono text-[10px] text-bpim-muted">
                            EX {step.newExScore} / BPI {step.newBpi.toFixed(2)}
                          </span>
                        )}
                        <span
                          className={cn(
                            "font-mono text-xs font-bold",
                            !hasDelta
                              ? "text-bpim-text"
                              : isPositive
                                ? "text-bpim-success"
                                : "text-bpim-danger",
                          )}
                        >
                          {rawTotalLabel} {step.rawAfter.toFixed(2)}
                        </span>
                        {hasDelta ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bpim-overlay/40">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  isPositive
                                    ? "bg-bpim-success"
                                    : "bg-bpim-danger",
                                )}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "w-14 text-right font-mono text-xs font-bold",
                                isPositive
                                  ? "text-bpim-success"
                                  : "text-bpim-danger",
                              )}
                            >
                              {isPositive ? "+" : ""}
                              {(step.rawDelta as number).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-bpim-muted">
                            {t(
                              "dashboard.currentBpi.ratchetHistory.initialEntry",
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {historyStepsTruncated && (
                  <p className="pt-1 text-center text-[10px] text-bpim-muted">
                    {tFormat(
                      "dashboard.currentBpi.ratchetHistory.contributionTruncated",
                      { count: MAX_HISTORY_STEPS },
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatchetHistoryDialog;
