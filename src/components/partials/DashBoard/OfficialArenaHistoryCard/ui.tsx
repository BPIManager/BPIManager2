import { useMemo, useEffect, useState } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "@/lib/dayjs";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";
import type {
  ArenaEventEntry,
  ArenaVersionMetadata,
} from "@/lib/cron/arena/types";
import type { ArenaHistoryRecord } from "@/hooks/arena/useOfficialArenaHistory";

const CLASS_TO_NUM = Object.fromEntries(
  ARENA_RANK_ORDER.map((cls, i) => [cls, i + 1]),
) as Record<string, number>;
const NUM_TO_CLASS = Object.fromEntries(
  ARENA_RANK_ORDER.map((cls, i) => [i + 1, cls]),
) as Record<number, string>;
const MAX_CLASS_NUM = ARENA_RANK_ORDER.length;

const CHART_STYLE = {
  contentStyle: {
    backgroundColor: "var(--color-bpim-surface-2)",
    border: "1px solid var(--color-bpim-border)",
    borderRadius: "8px",
    fontSize: "11px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  labelStyle: {
    color: "var(--color-bpim-text)",
    fontWeight: "bold",
    marginBottom: "4px",
  },
};

const TICK_PROPS = { fontSize: 9, fill: "var(--color-bpim-subtle)" };

type Granularity = "day" | "week" | "season";

const GRANULARITY_LABELS: { id: Granularity; label: string }[] = [
  { id: "day", label: "単日" },
  { id: "week", label: "一週間" },
  { id: "season", label: "シーズン" },
];

/** バケット内の最良レコードを合成する（クラス最上位・ランク最小・勝利数最大） */
function bestInBucket(records: ArenaHistoryRecord[]): ArenaHistoryRecord {
  let best = records[records.length - 1];
  let bestClassIdx = CLASS_TO_NUM[best.arenaClass] ?? 999;

  for (const r of records) {
    const idx = CLASS_TO_NUM[r.arenaClass] ?? 999;
    if (
      idx < bestClassIdx ||
      (idx === bestClassIdx &&
        (r.arenaRank ?? Infinity) < (best.arenaRank ?? Infinity))
    ) {
      best = r;
      bestClassIdx = idx;
    }
  }

  const maxWins = Math.max(...records.map((r) => r.wins ?? 0));
  return { ...best, wins: maxWins };
}

const GRANULARITY_WINDOW_MS: Record<Granularity, number | null> = {
  day: 24 * 3600_000,
  week: 7 * 86_400_000,
  season: null,
};

function filterByWindow(
  records: ArenaHistoryRecord[],
  granularity: Granularity,
): ArenaHistoryRecord[] {
  const window = GRANULARITY_WINDOW_MS[granularity];
  if (!window || records.length === 0) return records;
  const latestTs = Math.max(
    ...records.map((r) => new Date(r.fetchedAt).getTime()),
  );
  const cutoff = latestTs - window;
  return records.filter((r) => new Date(r.fetchedAt).getTime() >= cutoff);
}

function downsample(
  records: ArenaHistoryRecord[],
  granularity: Granularity,
): ArenaHistoryRecord[] {
  if (granularity === "day") return records;

  const getBucket = (iso: string): string => {
    if (granularity === "week") {
      return String(
        Math.floor(new Date(iso).getTime() / (6 * 3600_000)) * (6 * 3600_000),
      );
    }
    return dayjs(iso).tz().format("YYYY-MM-DD");
  };

  const buckets = new Map<string, ArenaHistoryRecord[]>();
  for (const r of records) {
    const key = getBucket(r.fetchedAt);
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }

  return Array.from(buckets.values()).map(bestInBucket);
}

function formatCountdown(ms: number) {
  const total = Math.max(0, ms);
  const d = Math.floor(total / 86_400_000);
  const h = Math.floor((total % 86_400_000) / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return { d: String(d), h: p(h), m: p(m), s: p(s) };
}

function processRecords(records: ArenaHistoryRecord[]) {
  return records.map((d, i) => ({
    time: dayjs(d.fetchedAt).tz().format("M/D HH:mm"),
    classNum: CLASS_TO_NUM[d.arenaClass] ?? null,
    rank: d.arenaRank,
    winsDelta:
      i === 0
        ? (d.wins ?? 0)
        : Math.max(0, (d.wins ?? 0) - (records[i - 1].wins ?? 0)),
  }));
}

interface Props {
  metadata: ArenaVersionMetadata | undefined;
  metaLoading: boolean;
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
  data: ArenaHistoryRecord[] | undefined;
  dataLoading: boolean;
}

export const OfficialArenaHistoryCardUI = ({
  metadata,
  metaLoading,
  selectedIndex,
  onSelectIndex,
  data,
  dataLoading,
}: Props) => {
  const events = metadata?.events ?? [];
  const selectedEvent: ArenaEventEntry | undefined = events[selectedIndex];

  const [countdown, setCountdown] = useState<ReturnType<
    typeof formatCountdown
  > | null>(null);
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

  const isUpcoming = !!countdown;
  const hasNoData = !dataLoading && data !== undefined && data.length === 0;

  const [granularity, setGranularity] = useState<Granularity>("season");

  const displayRecords = useMemo(() => {
    if (data && data.length > 0) return data;
    return null;
  }, [data, isUpcoming, selectedEvent]);

  const processedData = useMemo(() => {
    if (!displayRecords) return null;
    return processRecords(
      downsample(filterByWindow(displayRecords, granularity), granularity),
    );
  }, [displayRecords, granularity]);

  const maxWinsDelta = useMemo(
    () => Math.max(1, ...(processedData?.map((d) => d.winsDelta) ?? [0])),
    [processedData],
  );

  const hasRank = processedData?.some((d) => d.rank !== null) ?? false;
  const hasWins = processedData?.some((d) => d.winsDelta > 0) ?? false;

  return (
    <DashCard>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-bpim-text">ARENAモード戦績</p>
        {metaLoading ? (
          <Skeleton className="h-7 w-40 rounded-md" />
        ) : events.length > 0 ? (
          <select
            value={selectedIndex}
            onChange={(e) => onSelectIndex(Number(e.target.value))}
            className="rounded-md border border-bpim-border bg-bpim-surface-2 px-2 py-1 text-[11px] font-bold text-bpim-text focus:outline-none"
          >
            {events.map((ev, i) => (
              <option key={ev.round} value={i}>
                第{ev.round}回
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {selectedEvent && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] text-bpim-muted">
            {dayjs(selectedEvent.start).tz().format("YYYY/M/D HH:mm")}
            {" 〜 "}
            {dayjs(selectedEvent.end).tz().format("YYYY/M/D HH:mm")} JST
          </p>
          <div className="flex gap-1">
            {GRANULARITY_LABELS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setGranularity(id)}
                className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                  granularity === id
                    ? "bg-bpim-primary text-white"
                    : "bg-bpim-surface-2 text-bpim-muted hover:bg-bpim-surface-3"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isUpcoming && countdown && (
        <div className="mb-5 rounded-xl border border-bpim-primary/20 bg-bpim-primary/5 px-4 py-4 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-bpim-primary/70">
            第{selectedEvent?.round}回 開催まで
          </p>
          <div className="flex items-end justify-center gap-1">
            {[
              { value: countdown.d, label: "日" },
              { value: countdown.h, label: "時" },
              { value: countdown.m, label: "分" },
              { value: countdown.s, label: "秒" },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-end gap-0.5">
                {i > 0 && (
                  <span className="mb-1 text-lg font-black text-bpim-primary/40">
                    :
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-black tabular-nums text-bpim-primary">
                    {value}
                  </span>
                  <span className="text-[9px] text-bpim-muted">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isUpcoming && hasNoData && !dataLoading && (
        <p className="py-8 text-center text-xs text-bpim-muted">
          当該期間のデータがありません
        </p>
      )}

      {dataLoading && (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      )}

      {processedData && (
        <div className="h-56 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              margin={{ top: 4, right: -10, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-bpim-border)"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="time"
                tick={TICK_PROPS}
                tickLine={false}
                axisLine={false}
                angle={-25}
                textAnchor="end"
                height={36}
                interval="preserveStartEnd"
                padding={{ left: 8, right: 8 }}
              />

              <YAxis
                yAxisId="class"
                reversed
                domain={[0.5, MAX_CLASS_NUM + 0.5]}
                ticks={Array.from({ length: MAX_CLASS_NUM }, (_, i) => i + 1)}
                tickFormatter={(v: number) => NUM_TO_CLASS[v] ?? ""}
                tick={TICK_PROPS}
                tickLine={false}
                axisLine={false}
                width={28}
              />

              {hasRank && (
                <YAxis
                  yAxisId="rank"
                  orientation="right"
                  reversed
                  tick={TICK_PROPS}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v) => (v as number).toLocaleString("ja-JP")}
                />
              )}

              {hasWins && (
                <YAxis yAxisId="wins" hide domain={[0, maxWinsDelta * 3]} />
              )}

              <Tooltip
                {...CHART_STYLE}
                formatter={(v, name) => {
                  if (name === "classNum")
                    return [NUM_TO_CLASS[v as number] ?? v, "クラス"];
                  if (name === "rank")
                    return [(v as number).toLocaleString("ja-JP"), "順位"];
                  if (name === "winsDelta") return [v, "+勝利"];
                  return [v, name];
                }}
              />

              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                formatter={(value) => {
                  if (value === "classNum") return "クラス";
                  if (value === "rank") return "順位";
                  if (value === "winsDelta") return "+勝利";
                  return value;
                }}
              />

              <Line
                yAxisId="class"
                type="stepAfter"
                dataKey="classNum"
                stroke="var(--color-bpim-primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-bpim-primary)" }}
                connectNulls={false}
              />

              {hasRank && (
                <Line
                  yAxisId="rank"
                  type="monotone"
                  dataKey="rank"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10b981" }}
                  connectNulls={false}
                />
              )}

              {hasWins && (
                <Bar
                  yAxisId="wins"
                  dataKey="winsDelta"
                  fill="var(--color-bpim-warning)"
                  fillOpacity={0.75}
                  radius={[2, 2, 0, 0]}
                  barSize={12}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashCard>
  );
};
