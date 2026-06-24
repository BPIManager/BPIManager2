"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IIDX_VERSIONS } from "@/constants/iidx/latestVersion";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  currentVersion: string;
  currentPeriod: string;
  granularity: "month" | "year";
  version: string;
  availableMonths: string[];
  availableSet: Set<string>;
  availableYears: string[];
  calendarYear: string;
  calendarYearIdx: number;
  canPrevYear: boolean;
  canNextYear: boolean;
  isLoading: boolean;
  isCurrentYearMode: boolean;
  onGranularityChange: (g: "month" | "year") => void;
  onVersionChange: (v: string) => void;
  onMonthClick: (monthStr: string) => void;
  onYearClick: (year: string) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

const btnActive = {
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "rgba(255,255,255,0.95)",
};
const btnBase = {
  border: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.35)",
  background: "transparent",
};
const btnDisabled = {
  border: "1px solid rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.15)",
  background: "transparent",
  cursor: "not-allowed" as const,
};

export const PeriodSelectorUI = ({
  currentVersion,
  currentPeriod,
  granularity,
  version,
  availableMonths,
  availableSet,
  availableYears,
  calendarYear,
  canPrevYear,
  canNextYear,
  isLoading,
  isCurrentYearMode,
  onGranularityChange,
  onVersionChange,
  onMonthClick,
  onYearClick,
  onPrevYear,
  onNextYear,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const monthLabels = t("monthlyReview.period.monthLabels").split(",");
  return (
  <Popover>
    <PopoverTrigger asChild>
      <button
        className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/10"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <Calendar className="h-3.5 w-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      className="w-72 p-4"
      style={{
        background: "rgba(14,14,22,0.97)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mb-4">
        <p
          className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {t("monthlyReview.period.granularity")}
        </p>
        <div className="flex gap-2">
          {(["month", "year"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className="flex-1 rounded-lg py-1.5 text-xs font-bold transition-all"
              style={granularity === g ? btnActive : btnBase}
            >
              {g === "month" ? t("monthlyReview.period.month") : t("monthlyReview.period.year")}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p
          className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {t("monthlyReview.period.version")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {([...IIDX_VERSIONS] as string[]).map((v) => (
            <button
              key={v}
              onClick={() => onVersionChange(v)}
              className="rounded-md px-2 py-1 text-xs font-bold transition-all"
              style={version === v ? btnActive : btnBase}
            >
              {v === "INF" ? "INF" : `IIDX${v}`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <span
            className="text-[10px]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {t("monthlyReview.period.loading")}
          </span>
        </div>
      ) : availableMonths.length === 0 ? (
        <div className="flex h-16 items-center justify-center">
          <span
            className="text-[10px]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {t("monthlyReview.period.noData")}
          </span>
        </div>
      ) : granularity === "month" ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button
              onClick={onPrevYear}
              disabled={!canPrevYear}
              className="rounded p-1 transition-colors"
              style={{
                color: canPrevYear
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span
              className="text-xs font-bold"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {tFormat("monthlyReview.period.yearLabel", { year: calendarYear })}
            </span>
            <button
              onClick={onNextYear}
              disabled={!canNextYear}
              className="rounded p-1 transition-colors"
              style={{
                color: canNextYear
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              const monthStr = `${calendarYear}-${m}`;
              const hasData = availableSet.has(monthStr);
              const isSelected =
                !isCurrentYearMode &&
                currentPeriod === monthStr &&
                version === currentVersion;
              return (
                <button
                  key={m}
                  onClick={() => hasData && onMonthClick(monthStr)}
                  disabled={!hasData}
                  className="rounded-md py-1.5 text-xs font-bold transition-all"
                  style={
                    isSelected
                      ? {
                          ...btnActive,
                          background: "rgba(52,211,153,0.2)",
                          borderColor: "rgba(52,211,153,0.4)",
                          color: "#34d399",
                        }
                      : hasData
                        ? btnBase
                        : btnDisabled
                  }
                  onMouseEnter={(e) =>
                    hasData &&
                    !isSelected &&
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    hasData &&
                    !isSelected &&
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {monthLabels[i]}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <p
            className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {t("monthlyReview.period.selectYear")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableYears.map((y) => {
              const isSelected =
                isCurrentYearMode &&
                currentPeriod === y &&
                version === currentVersion;
              return (
                <button
                  key={y}
                  onClick={() => onYearClick(y)}
                  className="rounded-md px-3 py-1.5 text-xs font-bold transition-all"
                  style={
                    isSelected
                      ? {
                          ...btnActive,
                          background: "rgba(52,211,153,0.2)",
                          borderColor: "rgba(52,211,153,0.4)",
                          color: "#34d399",
                        }
                      : btnBase
                  }
                  onMouseEnter={(e) =>
                    !isSelected &&
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    !isSelected &&
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {tFormat("monthlyReview.period.yearLabel", { year: y })}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PopoverContent>
  </Popover>
  );
};
