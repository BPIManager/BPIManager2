"use client";

import { useState, useMemo } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import {
  useTotalBpiStats,
  useActiveDates,
} from "@/hooks/stats/useCurrentTotalBpi";
import { CurrentBpiCard } from "./ui";

function calcDefaultCompareDate(activeDates: string[]): string | undefined {
  if (activeDates.length === 0) return undefined;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const lastMonthYear = month === 0 ? year - 1 : year;
  const lastMonth = month === 0 ? 11 : month - 1;
  const target = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const normalized = activeDates.map((d) => d.slice(0, 10)).sort();
  const candidates = normalized.filter((d) => d <= target);
  return candidates.length > 0 ? candidates[candidates.length - 1] : undefined;
}

export const CurrentBpiSection = ({ userId }: { userId: string }) => {
  const { version, compareVersion } = useStatsFilter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const historicalVersion = compareVersion || version;

  const { stats: currentStats, isLoading } = useTotalBpiStats(userId, version);
  const { dates: activeDates, isLoading: isActiveDatesLoading } =
    useActiveDates(userId, historicalVersion);

  const defaultCompareDate = useMemo(
    () => calcDefaultCompareDate(activeDates),
    [activeDates],
  );

  const compareDate = selectedDate ?? defaultCompareDate;

  const { stats: historicalStats, isLoading: isHistoricalLoading } =
    useTotalBpiStats(
      compareDate ? userId : undefined,
      historicalVersion,
      compareDate,
    );

  return (
    <CurrentBpiCard
      currentStats={currentStats}
      historicalStats={compareDate ? historicalStats : undefined}
      activeDates={activeDates}
      isActiveDatesLoading={isActiveDatesLoading}
      isLoading={isLoading}
      isHistoricalLoading={isHistoricalLoading}
      selectedDate={selectedDate}
      defaultCompareDate={defaultCompareDate}
      onDateSelect={setSelectedDate}
    />
  );
};
