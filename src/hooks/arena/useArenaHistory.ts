import { useMemo, useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";
import type { ArenaEventEntry } from "@/lib/cron/arena/types";
import type { ArenaHistoryRecord } from "@/hooks/arena/useOfficialArenaHistory";

export type Granularity = "day" | "week" | "season";

export const CLASS_TO_NUM = Object.fromEntries(
  ARENA_RANK_ORDER.map((cls, i) => [cls, i + 1]),
) as Record<string, number>;

export const NUM_TO_CLASS = Object.fromEntries(
  ARENA_RANK_ORDER.map((cls, i) => [i + 1, cls]),
) as Record<number, string>;

export const MAX_CLASS_NUM = ARENA_RANK_ORDER.length;

export interface ProcessedPoint {
  time: string;
  classNum: number | null;
  rank: number | null;
  winsDelta: number;
}

export interface ArenaHistoryState {
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  countdown: ReturnType<typeof formatCountdown> | null;
  isUpcoming: boolean;
  hasNoData: boolean;
  processedData: ProcessedPoint[] | null;
  maxWinsDelta: number;
  hasRank: boolean;
  hasWins: boolean;
}

const WINDOW_MS: Record<Granularity, number | null> = {
  day:    24 * 3_600_000,
  week:   7  * 86_400_000,
  season: null,
};

function filterByWindow(records: ArenaHistoryRecord[], granularity: Granularity): ArenaHistoryRecord[] {
  const ms = WINDOW_MS[granularity];
  if (!ms || records.length === 0) return records;
  const latestTs = Math.max(...records.map((r) => new Date(r.fetchedAt).getTime()));
  return records.filter((r) => new Date(r.fetchedAt).getTime() >= latestTs - ms);
}

function bestInBucket(records: ArenaHistoryRecord[]): ArenaHistoryRecord {
  let best = records[records.length - 1];
  let bestIdx = CLASS_TO_NUM[best.arenaClass] ?? 999;
  for (const r of records) {
    const idx = CLASS_TO_NUM[r.arenaClass] ?? 999;
    if (idx < bestIdx || (idx === bestIdx && (r.arenaRank ?? Infinity) < (best.arenaRank ?? Infinity))) {
      best = r;
      bestIdx = idx;
    }
  }
  return { ...best, wins: Math.max(...records.map((r) => r.wins ?? 0)) };
}

function downsample(records: ArenaHistoryRecord[], granularity: Granularity): ArenaHistoryRecord[] {
  if (granularity === "day") return records;
  const getBucket = (iso: string) =>
    granularity === "week"
      ? String(Math.floor(new Date(iso).getTime() / (6 * 3_600_000)) * (6 * 3_600_000))
      : dayjs(iso).tz().format("YYYY-MM-DD");

  const buckets = new Map<string, ArenaHistoryRecord[]>();
  for (const r of records) {
    const key = getBucket(r.fetchedAt);
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }
  return Array.from(buckets.values()).map(bestInBucket);
}

function toProcessedPoints(records: ArenaHistoryRecord[]): ProcessedPoint[] {
  return records.map((d, i) => ({
    time: dayjs(d.fetchedAt).tz().format("M/D HH:mm"),
    classNum: CLASS_TO_NUM[d.arenaClass] ?? null,
    rank: d.arenaRank,
    winsDelta: i === 0 ? (d.wins ?? 0) : Math.max(0, (d.wins ?? 0) - (records[i - 1].wins ?? 0)),
  }));
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    d: String(Math.floor(total / 86_400_000)),
    h: p(Math.floor((total % 86_400_000) / 3_600_000)),
    m: p(Math.floor((total % 3_600_000) / 60_000)),
    s: p(Math.floor((total % 60_000) / 1_000)),
  };
}

export function useArenaHistory(
  data: ArenaHistoryRecord[] | undefined,
  dataLoading: boolean,
  selectedEvent: ArenaEventEntry | undefined,
): ArenaHistoryState {
  const [granularity, setGranularity] = useState<Granularity>("season");
  const [countdown, setCountdown] = useState<ReturnType<typeof formatCountdown> | null>(null);

  useEffect(() => {
    if (!selectedEvent) return;
    const target = new Date(selectedEvent.start).getTime();
    const tick = () => {
      const diff = target - Date.now();
      setCountdown(diff > 0 ? formatCountdown(diff) : null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selectedEvent]);

  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return null;
    return toProcessedPoints(downsample(filterByWindow(data, granularity), granularity));
  }, [data, granularity]);

  const maxWinsDelta = useMemo(
    () => Math.max(1, ...(processedData?.map((d) => d.winsDelta) ?? [0])),
    [processedData],
  );

  return {
    granularity,
    setGranularity,
    countdown,
    isUpcoming: !!countdown,
    hasNoData: !dataLoading && data !== undefined && data.length === 0,
    processedData,
    maxWinsDelta,
    hasRank: processedData?.some((d) => d.rank !== null) ?? false,
    hasWins: processedData?.some((d) => d.winsDelta > 0) ?? false,
  };
}
