import { Swords, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useWinLossHistory } from "@/hooks/social/useWinLossHistory";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { WinLossHistoryChartSkeleton } from "./skeleton";

interface WinLossEntry {
  level: number;
  win: number;
  lose: number;
  draw: number;
}

export interface WinLossStatsProps {
  winLossData: WinLossEntry[];
  viewerId?: string;
  rivalId?: string;
  myName?: string;
  rivalName?: string;
}

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
}

const StatBox = ({ label, value, color }: StatBoxProps) => (
  <div className="flex flex-col items-center gap-0">
    <span className={cn("text-xl font-black leading-none", color)}>
      {value}
    </span>
    <span className="text-[8px] font-bold tracking-tighter text-bpim-subtle uppercase">
      {label}
    </span>
  </div>
);

const WinLossHistoryChart = ({
  viewerId,
  rivalId,
  level,
  myName,
  rivalName,
}: {
  viewerId: string;
  rivalId: string;
  level: 11 | 12;
  myName?: string;
  rivalName?: string;
}) => {
  const { data, isLoading } = useWinLossHistory(viewerId, rivalId, level, true);
  const fillId = `wlFill-${level}`;
  const strokeId = `wlStroke-${level}`;

  const { chartData, gradientOffset, yTicks, xMonthTicks } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], gradientOffset: 0, yTicks: [0], xMonthTicks: [] };
    const max = Math.max(0, ...data.map((d) => d.cumulative));
    const min = Math.min(0, ...data.map((d) => d.cumulative));
    const range = max - min;

    // Y軸: 4〜5刻みの粗めなtick
    const rawStep = range > 0 ? range / 4 : 1;
    const step = Math.max(1, Math.ceil(rawStep));
    const tickMin = Math.floor(min / step) * step;
    const tickMax = Math.ceil(max / step) * step;
    const yTicks: number[] = [];
    for (let v = tickMin; v <= tickMax; v += step) yTicks.push(v);

    // X軸: 各月1日のデータ日付のみ（データにない1日も含める）
    const first = new Date(data[0].date);
    const last = new Date(data[data.length - 1].date);
    const dateDates = new Set(data.map((d) => d.date));
    const cur = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
    );
    if (
      cur <
      new Date(
        Date.UTC(
          first.getUTCFullYear(),
          first.getUTCMonth(),
          first.getUTCDate(),
        ),
      )
    )
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    const xMonthTicks: string[] = [];
    while (cur <= last) {
      const key = cur.toISOString().slice(0, 10);
      // 実データにある最寄り日付を探す（1日が存在しない場合はスキップ）
      if (dateDates.has(key)) xMonthTicks.push(key);
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }

    return {
      chartData: data,
      gradientOffset: range > 0 ? max / range : max >= 0 ? 1 : 0,
      yTicks,
      xMonthTicks,
    };
  }, [data]);

  if (isLoading) return <WinLossHistoryChartSkeleton />;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm bg-red-400/70" />
          <span className="text-[9px] text-bpim-muted">{myName ?? "自分"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm bg-blue-400/70" />
          <span className="text-[9px] text-bpim-muted">
            {rivalName ?? "相手"}
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-36 items-center justify-center">
          <span className="text-[10px] text-bpim-muted">
            データがありません
          </span>
        </div>
      ) : (
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset={gradientOffset}
                    stopColor="#ef4444"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset={gradientOffset}
                    stopColor="#3b82f6"
                    stopOpacity={0.35}
                  />
                </linearGradient>
                <linearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset={gradientOffset}
                    stopColor="#ef4444"
                    stopOpacity={1}
                  />
                  <stop
                    offset={gradientOffset}
                    stopColor="#3b82f6"
                    stopOpacity={1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--bpim-overlay))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                ticks={xMonthTicks}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getUTCMonth() + 1}月`;
                }}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--bpim-text-muted))", fontSize: 9 }}
                interval={0}
              />
              <YAxis
                ticks={yTicks}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--bpim-text-muted))", fontSize: 9 }}
                allowDecimals={false}
              />
              <ReferenceLine
                y={0}
                stroke="hsl(var(--bpim-text-muted))"
                strokeDasharray="4 2"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as {
                    delta: number;
                    cumulative: number;
                  };
                  return (
                    <div className="rounded-md border border-bpim-border bg-bpim-surface p-2 shadow-xl text-[10px]">
                      <p className="font-bold text-bpim-muted mb-1">{label}</p>
                      <p
                        className={cn(
                          "font-mono font-bold",
                          d.cumulative >= 0 ? "text-red-400" : "text-blue-400",
                        )}
                      >
                        累計: {d.cumulative > 0 ? "+" : ""}
                        {d.cumulative}
                      </p>
                      <p className="text-bpim-muted">
                        当日: {d.delta > 0 ? "+" : ""}
                        {d.delta}
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: "var(--bpim-overlay)" }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={`url(#${strokeId})`}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 3 }}
                animationDuration={800}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export const WinLossStats = ({
  winLossData,
  viewerId,
  rivalId,
  myName,
  rivalName,
}: WinLossStatsProps) => {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  const toggleLevel = (lv: number) =>
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      next.has(lv) ? next.delete(lv) : next.add(lv);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Swords className="h-3 w-3 text-bpim-muted" />
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          WIN / LOSS STATS
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {([11, 12] as const).map((lv) => {
          const stats = winLossData.find((s) => s.level === lv) ?? {
            win: 0,
            lose: 0,
            draw: 0,
          };
          const total = stats.win + stats.lose + stats.draw;
          const winRate =
            total > 0 ? ((stats.win / total) * 100).toFixed(1) : "0.0";
          const isExpanded = expandedLevels.has(lv);

          return (
            <div
              key={lv}
              className="rounded-xl border border-bpim-border bg-bpim-surface-2/40 p-4"
            >
              <div className="mb-3 flex justify-between items-center">
                <span className="text-xs font-bold text-bpim-primary">
                  LEVEL {lv}
                </span>
                <span className="text-[10px] font-bold text-bpim-success">
                  {winRate}%
                </span>
              </div>

              <div className="flex justify-around items-center">
                <StatBox
                  label="WIN"
                  value={stats.win}
                  color="text-bpim-success"
                />
                <StatBox
                  label="DRAW"
                  value={stats.draw}
                  color="text-bpim-muted"
                />
                <StatBox
                  label="LOSE"
                  value={stats.lose}
                  color="text-bpim-danger"
                />
              </div>

              <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-bpim-overlay/60">
                <div
                  className="h-full bg-bpim-success transition-all duration-700 ease-in-out"
                  style={{ width: `${winRate}%` }}
                />
              </div>

              <>
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => toggleLevel(lv)}
                    className="flex items-center justify-center rounded-md border border-bpim-border bg-bpim-overlay/30 p-1 text-bpim-muted transition-colors hover:bg-bpim-overlay/60"
                    aria-label={isExpanded ? "履歴を閉じる" : "履歴を表示"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <WinLossHistoryChart
                    viewerId={viewerId!}
                    rivalId={rivalId!}
                    level={lv}
                    myName={myName}
                    rivalName={rivalName}
                  />
                )}
              </>
            </div>
          );
        })}
      </div>
    </div>
  );
};
