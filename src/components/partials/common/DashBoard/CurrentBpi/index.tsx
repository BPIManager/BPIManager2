"use client";

import { useState, useMemo } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import {
  useTotalBpiStats,
  useActiveDates,
} from "@/hooks/stats/useCurrentTotalBpi";
import { useTotalBpiHistory } from "@/hooks/stats/useTotalBPIHistory";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import CurrentBpiCard from "./ui";

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

const CurrentBpiSection = ({ userId }: { userId: string }) => {
  const { version, compareVersion, levels, diffs } = useStatsFilter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isRatchetHistoryOpen, setIsRatchetHistoryOpen] = useState(false);
  const [ratchetGroupBy, setRatchetGroupBy] = useState<StatsGroupBy>("day");

  const versionKey = `${version}:${compareVersion ?? ""}`;
  const [prevVersionKey, setPrevVersionKey] = useState(versionKey);
  if (versionKey !== prevVersionKey) {
    setPrevVersionKey(versionKey);
    if (selectedDate !== null) {
      setSelectedDate(null);
    }
  }

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

  const { history: ratchetHistory, isLoading: isRatchetHistoryLoading } =
    useTotalBpiHistory(
      isRatchetHistoryOpen ? userId : undefined,
      levels,
      diffs,
      version,
      ratchetGroupBy,
    );

  return (
    <CurrentBpiCard
      currentStats={currentStats}
      activeDates={activeDates}
      isActiveDatesLoading={isActiveDatesLoading}
      isLoading={isLoading}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      historicalComparison={{
        stats: compareDate ? historicalStats : undefined,
        isLoading: isHistoricalLoading,
        defaultCompareDate,
      }}
      areaRank={currentStats}
      ratchetHistory={{
        isOpen: isRatchetHistoryOpen,
        onOpenChange: setIsRatchetHistoryOpen,
        data: ratchetHistory,
        isLoading: isRatchetHistoryLoading,
        groupBy: ratchetGroupBy,
        onGroupByChange: setRatchetGroupBy,
      }}
    />
  );
};

export default CurrentBpiSection;
