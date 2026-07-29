"use client";

import { useMemo } from "react";
import type { GrowthParticipant } from "@/types/stats/monthlyReview";
import dayjs from "@/lib/dayjs";
import { GrowthChartUI } from "./ui";

export { PALETTE } from "./ui";

interface Props {
  participants: GrowthParticipant[];
  hiddenKeys?: Set<string>;
  granularity?: "month" | "year";
}

export const GrowthChart = ({
  participants,
  hiddenKeys = new Set(),
  granularity = "month",
}: Props) => {
  const { chartData, keys } = useMemo(() => {
    if (participants.length === 0) return { chartData: [], keys: [] };

    const dateSet = new Set<string>();
    for (const p of participants) {
      for (const h of p.history) dateSet.add(h.date);
    }
    const sortedDates = [...dateSet].sort();

    const participantMaps = participants.map((p) => {
      const map = new Map(p.history.map((h) => [h.date, h.bpi]));
      const base = p.bpiBase + 15;
      return { userId: p.userId, map, base };
    });

    const lastKnown = new Array(participants.length).fill(null) as (
      | number
      | null
    )[];

    const rows = sortedDates.map((date) => {
      const label =
        granularity === "year"
          ? dayjs(date).format("M月")
          : dayjs(date).format("M/D");
      const row: Record<string, number | string> = { date: label };
      participantMaps.forEach(({ userId, map, base }, i) => {
        if (map.has(date)) {
          const bpi = map.get(date)!;
          const normalized = base > 0 ? (bpi + 15) / base : 1;
          lastKnown[i] = normalized;
        }
        if (lastKnown[i] !== null) {
          row[userId] = lastKnown[i]!;
        }
      });
      return row;
    });

    const keys = participants.map((p) => p.userId);
    return { chartData: rows, keys };
  }, [participants, granularity]);

  if (chartData.length < 2) return null;
  return (
    <GrowthChartUI
      chartData={chartData}
      keys={keys}
      participants={participants}
      hiddenKeys={hiddenKeys}
    />
  );
};
