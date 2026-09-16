"use client";

import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { useTranslation } from "@/hooks/common/useTranslation";
import { btnActive, btnBase } from "./_shared";
import { MonthGrid } from "./MonthGrid";
import { YearGrid } from "./YearGrid";
import { AllPanel } from "./AllPanel";

interface Props {
  currentVersion: string;
  currentPeriod: string;
  granularity: "month" | "year" | "all";
  version: string;
  isLoading: boolean;
  isCurrentYearMode: boolean;
  isCurrentAllMode: boolean;
  onGranularityChange: (g: "month" | "year" | "all") => void;
  onVersionChange: (v: string) => void;
  onAllClick: () => void;
  calendarYear: string;
  canPrevYear: boolean;
  canNextYear: boolean;
  onPrevYear: () => void;
  onNextYear: () => void;
  availableMonths: string[];
  availableSet: Set<string>;
  onMonthClick: (monthStr: string) => void;
  availableYears: string[];
  onYearClick: (year: string) => void;
}

const PeriodSelectorUI = ({
  currentVersion,
  currentPeriod,
  granularity,
  version,
  isLoading,
  isCurrentYearMode,
  isCurrentAllMode,
  onGranularityChange,
  onVersionChange,
  onAllClick,
  calendarYear,
  canPrevYear,
  canNextYear,
  onPrevYear,
  onNextYear,
  availableMonths,
  availableSet,
  onMonthClick,
  availableYears,
  onYearClick,
}: Props) => {
  const { t } = useTranslation();
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
          {(["month", "year", "all"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className="flex-1 rounded-lg py-1.5 text-xs font-bold transition-all"
              style={granularity === g ? btnActive : btnBase}
            >
              {g === "month"
                ? t("monthlyReview.period.month")
                : g === "year"
                  ? t("monthlyReview.period.year")
                  : t("monthlyReview.period.all")}
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

      {granularity === "all" ? (
        <AllPanel
          version={version}
          currentVersion={currentVersion}
          isCurrentAllMode={isCurrentAllMode}
          onAllClick={onAllClick}
        />
      ) : isLoading ? (
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
        <MonthGrid
          calendarYear={calendarYear}
          canPrevYear={canPrevYear}
          canNextYear={canNextYear}
          onPrevYear={onPrevYear}
          onNextYear={onNextYear}
          availableSet={availableSet}
          onMonthClick={onMonthClick}
          isCurrentYearMode={isCurrentYearMode}
          currentPeriod={currentPeriod}
          version={version}
          currentVersion={currentVersion}
        />
      ) : (
        <YearGrid
          availableYears={availableYears}
          onYearClick={onYearClick}
          isCurrentYearMode={isCurrentYearMode}
          currentPeriod={currentPeriod}
          version={version}
          currentVersion={currentVersion}
        />
      )}
    </PopoverContent>
  </Popover>
  );
};

export default PeriodSelectorUI;
