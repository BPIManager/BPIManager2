"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { useAvailablePeriods } from "@/hooks/stats/useAvailablePeriods";
import { useRouter } from "next/router";

interface Props {
  currentVersion: string;
  currentPeriod: string; // YYYY-MM or YYYY
  onSelect: (version: string, period: string) => void;
}

const MONTHS_JP = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export const PeriodSelector = ({
  currentVersion,
  currentPeriod,
  onSelect,
}: Props) => {
  const router = useRouter();
  const userId = router.query.userId as string | undefined;

  const isCurrentYearMode = /^\d{4}$/.test(currentPeriod);

  const [granularity, setGranularity] = useState<"month" | "year">(
    isCurrentYearMode ? "year" : "month",
  );
  const [version, setVersion] = useState(currentVersion);

  const { months: availableMonths, isLoading } = useAvailablePeriods(
    userId,
    version,
  );

  // Build derived sets from available months
  const availableSet = useMemo(
    () => new Set(availableMonths),
    [availableMonths],
  );
  const availableYears = useMemo(
    () =>
      [...new Set(availableMonths.map((m) => m.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [availableMonths],
  );

  // Calendar display state: which year page we're showing
  const [calendarYear, setCalendarYear] = useState<string>(() => {
    if (isCurrentYearMode) return currentPeriod;
    return currentPeriod.slice(0, 4);
  });

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

  const calendarYearIdx = availableYears.indexOf(calendarYear);
  const canPrevYear = calendarYearIdx < availableYears.length - 1;
  const canNextYear = calendarYearIdx > 0;

  const handleMonthClick = (monthStr: string) => {
    // monthStr = "YYYY-MM"
    onSelect(version, monthStr);
  };

  const handleYearClick = (year: string) => {
    onSelect(version, year);
  };

  // When version changes, reset calendar to most recent available year
  const handleVersionChange = (v: string) => {
    setVersion(v);
    // Reset calendar year on next render once availableMonths updates
  };

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
            粒度
          </p>
          <div className="flex gap-2">
            {(["month", "year"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className="flex-1 rounded-lg py-1.5 text-xs font-bold transition-all"
                style={granularity === g ? btnActive : btnBase}
              >
                {g === "month" ? "月" : "年"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p
            className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            バージョン
          </p>
          <div className="flex flex-wrap gap-1.5">
            {([...IIDX_VERSIONS] as string[]).map((v) => (
              <button
                key={v}
                onClick={() => handleVersionChange(v)}
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
              読み込み中...
            </span>
          </div>
        ) : availableMonths.length === 0 ? (
          <div className="flex h-16 items-center justify-center">
            <span
              className="text-[10px]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              データなし
            </span>
          </div>
        ) : granularity === "month" ? (
          /* Month calendar */
          <div>
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() =>
                  canPrevYear &&
                  setCalendarYear(availableYears[calendarYearIdx + 1])
                }
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
                {calendarYear}年
              </span>
              <button
                onClick={() =>
                  canNextYear &&
                  setCalendarYear(availableYears[calendarYearIdx - 1])
                }
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
                    onClick={() => hasData && handleMonthClick(monthStr)}
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
                    {MONTHS_JP[i]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Year list */
          <div>
            <p
              className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              年を選択
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
                    onClick={() => handleYearClick(y)}
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
                    {y}年
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
