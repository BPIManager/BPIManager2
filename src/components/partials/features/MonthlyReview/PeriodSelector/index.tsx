"use client";

import { useMemo, useState } from "react";
import { useAvailablePeriods } from "@/hooks/stats/useAvailablePeriods";
import { useRouter } from "next/router";
import { PeriodSelectorUI } from "./ui";

interface Props {
  currentVersion: string;
  currentPeriod: string;
  onSelect: (version: string, period: string) => void;
}

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

  const [calendarYear, setCalendarYear] = useState<string>(() => {
    if (isCurrentYearMode) return currentPeriod;
    return currentPeriod.slice(0, 4);
  });

  const calendarYearIdx = availableYears.indexOf(calendarYear);
  const canPrevYear = calendarYearIdx < availableYears.length - 1;
  const canNextYear = calendarYearIdx > 0;

  const handleVersionChange = (v: string) => {
    setVersion(v);
  };

  return (
    <PeriodSelectorUI
      currentVersion={currentVersion}
      currentPeriod={currentPeriod}
      granularity={granularity}
      version={version}
      availableMonths={availableMonths}
      availableSet={availableSet}
      availableYears={availableYears}
      calendarYear={calendarYear}
      calendarYearIdx={calendarYearIdx}
      canPrevYear={canPrevYear}
      canNextYear={canNextYear}
      isLoading={isLoading}
      isCurrentYearMode={isCurrentYearMode}
      onGranularityChange={setGranularity}
      onVersionChange={handleVersionChange}
      onMonthClick={(monthStr) => onSelect(version, monthStr)}
      onYearClick={(year) => onSelect(version, year)}
      onPrevYear={() =>
        canPrevYear && setCalendarYear(availableYears[calendarYearIdx + 1])
      }
      onNextYear={() =>
        canNextYear && setCalendarYear(availableYears[calendarYearIdx - 1])
      }
    />
  );
};
