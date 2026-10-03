
import { ListMusicIcon, CalendarDaysIcon, ArrowDownWideNarrowIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import type { HistoryStep } from "@/components/partials/common/DashBoard/Dialogs/RatchetHistory/types";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";

import { SKILL_COLOR, ListGranularity, ContributionSortOrder, MAX_HISTORY_STEPS } from "@/components/partials/common/DashBoard/Dialogs/RatchetHistory/types";


export interface ContributionListProps {
  displaySteps: HistoryStep[];
  granularity: ListGranularity;
  sortOrder: ContributionSortOrder;
  historyStepsTruncated: boolean;
  maxAbsRawDelta: number;
  isLoading: boolean;
  ratchetedLabel: string;
  rawTotalLabel: string;
  skillLabel: string;
  setGranularity: (value: ListGranularity) => void;
  setSortOrder: (value: ContributionSortOrder) => void;
  t: ReturnType<typeof useTranslation>["t"];
  tFormat: ReturnType<typeof useTranslation>["tFormat"];
}

/** 変化の内訳（曲単位・日付単位の切り替え、並び替え付き）の一覧。 */
export const ContributionList = ({
  displaySteps,
  granularity,
  sortOrder,
  historyStepsTruncated,
  maxAbsRawDelta,
  isLoading,
  ratchetedLabel,
  rawTotalLabel,
  skillLabel,
  setGranularity,
  setSortOrder,
  t,
  tFormat,
}: ContributionListProps) => {
  return (
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
  );
};
