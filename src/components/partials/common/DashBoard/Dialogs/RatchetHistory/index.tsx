import { useMemo, useState } from "react";
import { buildChartSeries, buildDateSteps, buildSongSteps } from "./derive";
import { RatchetChart } from "./chart";
import { ContributionList } from "./list";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useChartColors } from "@/hooks/common/useChartColors";
import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";
import type { BpiHistoryItem } from "@/types/stats/bpiHistory";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import { SKILL_COLOR, GROUP_BY_VALUES, ListGranularity, ContributionSortOrder } from "@/components/partials/common/DashBoard/Dialogs/RatchetHistory/types";

export interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data?: BpiHistoryItem[];
  isLoading: boolean;
  groupBy: StatsGroupBy;
  onGroupByChange: (g: StatsGroupBy) => void;
}

export const RatchetHistoryDialog = ({
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

  const { chartData, ticks, startIndex, latestGap } = useMemo(
    () => buildChartSeries(data),
    [data],
  );

  const songStepsResult = useMemo(() => buildSongSteps(data), [data]);

  const dateStepsResult = useMemo(
    () => buildDateSteps(data, tFormat),
    [data, tFormat],
  );

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
          <RatchetChart
            isLoading={isLoading}
            chartData={chartData}
            ticks={ticks}
            startIndex={startIndex}
            formatDate={formatDate}
            rawLabel={rawLabel}
            ratchetedLabel={ratchetedLabel}
            rawDeltaLabel={rawDeltaLabel}
            skillLabel={skillLabel}
            c={c}
            t={t}
          />
          <ContributionList
            displaySteps={displaySteps}
            granularity={granularity}
            sortOrder={sortOrder}
            historyStepsTruncated={historyStepsTruncated}
            maxAbsRawDelta={maxAbsRawDelta}
            isLoading={isLoading}
            ratchetedLabel={ratchetedLabel}
            rawTotalLabel={rawTotalLabel}
            skillLabel={skillLabel}
            setGranularity={setGranularity}
            setSortOrder={setSortOrder}
            t={t}
            tFormat={tFormat}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatchetHistoryDialog;
