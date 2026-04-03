"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarIcon,
  XIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  HistoryIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import type { TotalBpiStats } from "@/hooks/stats/useCurrentTotalBpi";
import { CurrentBpiSkeleton } from "./skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { CalendarPicker } from "./calendar";
import dayjs from "@/lib/dayjs";

interface CurrentBpiCardProps {
  currentStats?: TotalBpiStats;
  historicalStats?: TotalBpiStats;
  activeDates: string[];
  isActiveDatesLoading: boolean;
  isLoading: boolean;
  isHistoricalLoading: boolean;
  selectedDate: string | null;
  defaultCompareDate?: string;
  onDateSelect: (date: string | null) => void;
}

export const CurrentBpiCard = ({
  currentStats,
  historicalStats,
  activeDates,
  isActiveDatesLoading,
  isLoading,
  isHistoricalLoading,
  selectedDate,
  defaultCompareDate,
  onDateSelect,
}: CurrentBpiCardProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { version, compareVersion } = useStatsFilter();

  const bpi = currentStats?.totalBpi ?? -15;
  const rank = currentStats?.estimatedRank ?? 0;

  const activeDateSet = new Set(
    activeDates.map((d) => dayjs(d).format("YYYY-MM-DD")),
  );

  useEffect(() => {
    if (selectedDate) {
      onDateSelect(null);
    }
  }, [version, compareVersion]);

  const initialMonth = useMemo(() => {
    const targetDate =
      selectedDate ||
      (activeDates.length > 0 ? activeDates[activeDates.length - 1] : null);

    if (!targetDate) return undefined;

    const target = dayjs(targetDate);
    return {
      year: target.year(),
      month: target.month(),
    };
  }, [selectedDate, activeDates]);

  const effectiveDate = selectedDate ?? defaultCompareDate ?? null;
  const delta =
    effectiveDate && historicalStats != null
      ? bpi - historicalStats.totalBpi
      : null;

  if (isLoading) return <CurrentBpiSkeleton />;

  return (
    <DashCard
      className={cn(
        "transition-all duration-300",
        selectedDate && "ring-1 ring-bpim-primary/30 bg-bpim-primary/5",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted md:text-xs">
          総合BPI(☆12のみ)
        </span>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={selectedDate ? "default" : "ghost"}
              size="icon-sm"
              className={cn(
                "transition-transform active:scale-90",
                selectedDate && "shadow-sm shadow-bpim-primary/20",
              )}
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-1 shadow-xl">
            {isActiveDatesLoading ? (
              <div className="flex h-40 items-center justify-center px-8">
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="mb-2 flex items-center gap-1.5 border-b border-bpim-border px-1 pb-2">
                  <HistoryIcon className="size-3 text-bpim-primary" />
                  <span className="text-xs font-bold text-bpim-text uppercase tracking-tight">
                    過去の特定時点と比較
                  </span>
                </div>

                <CalendarPicker
                  activeDates={activeDateSet}
                  selectedDate={selectedDate}
                  onSelect={(date) => {
                    onDateSelect(date === selectedDate ? null : date);
                    setCalendarOpen(false);
                  }}
                  initialMonth={initialMonth}
                />
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 flex flex-row items-end gap-8">
        <div>
          <span
            className={cn(
              "font-mono text-5xl font-bold tabular-nums leading-none tracking-tighter",
              bpi >= 0 ? "text-bpim-text" : "text-bpim-muted",
            )}
          >
            {bpi.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
            推定順位
          </span>
          <span className="text-xl font-bold text-bpim-text">
            ~{rank.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-bpim-muted">位</span>
          </span>
        </div>
      </div>

      <div className="mt-5 min-h-[42px]">
        {effectiveDate ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 transition-all",
              selectedDate
                ? "border-bpim-primary/30 bg-bpim-primary/5"
                : "border-bpim-border bg-bpim-surface-2/60",
            )}
          >
            <div className="flex items-center gap-2 shrink-0">
              <HistoryIcon className="size-3 text-bpim-muted" />
              <span className="font-mono text-[11px] font-medium text-bpim-muted">
                {dayjs(effectiveDate).format("YYYY-MM-DD")}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-1">
              {isHistoricalLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                historicalStats && (
                  <>
                    <span className="font-mono text-sm text-bpim-muted">
                      {historicalStats.totalBpi.toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-mono text-sm font-bold",
                        delta! > 0
                          ? "text-bpim-success"
                          : delta! < 0
                            ? "text-bpim-danger"
                            : "text-bpim-muted",
                      )}
                    >
                      {delta! > 0 ? (
                        <TrendingUpIcon className="size-3.5" />
                      ) : delta! < 0 ? (
                        <TrendingDownIcon className="size-3.5" />
                      ) : null}
                      {delta! > 0 ? "+" : ""}
                      {delta!.toFixed(2)}
                    </span>
                  </>
                )
              )}
            </div>
            {selectedDate && (
              <button
                onClick={() => onDateSelect(null)}
                className="ml-auto p-1 text-bpim-muted hover:text-bpim-danger"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-bpim-border/50 py-2.5">
            <span className="text-[10px] text-bpim-muted/40 font-medium">
              日付を設定して比較を表示
            </span>
          </div>
        )}
      </div>
    </DashCard>
  );
};
