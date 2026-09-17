import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { btnActive, btnBase, btnDisabled } from "./_shared";

export const MonthGrid = ({
  calendarYear,
  canPrevYear,
  canNextYear,
  onPrevYear,
  onNextYear,
  availableSet,
  onMonthClick,
  isCurrentYearMode,
  currentPeriod,
  version,
  currentVersion,
}: {
  calendarYear: string;
  canPrevYear: boolean;
  canNextYear: boolean;
  onPrevYear: () => void;
  onNextYear: () => void;
  availableSet: Set<string>;
  onMonthClick: (monthStr: string) => void;
  isCurrentYearMode: boolean;
  currentPeriod: string;
  version: string;
  currentVersion: string;
}) => {
  const { t, tFormat } = useTranslation();
  const monthLabels = t("monthlyReview.period.monthLabels").split(",");

  return (
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
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
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
  );
};
