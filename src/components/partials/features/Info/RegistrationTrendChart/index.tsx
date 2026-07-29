import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashCard } from "@/components/ui/dashcard";
import { useChartColors } from "@/hooks/common/useChartColors";

type TrendEntry = {
  date: string;
  logs: number;
  allScores: number;
  scores: number;
};

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = d.getDate() - d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), diff)
    .toISOString()
    .slice(0, 10);
}

export function RegistrationTrendChart({ data }: { data: TrendEntry[] }) {
  const c = useChartColors();
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const grouped = (() => {
    if (groupBy === "day") return data;
    const map = new Map<string, TrendEntry>();
    data.forEach((d) => {
      const key = groupBy === "month" ? d.date.slice(0, 7) : getWeekKey(d.date);
      const e = map.get(key) ?? { date: key, logs: 0, allScores: 0, scores: 0 };
      e.logs += d.logs;
      e.allScores += d.allScores;
      e.scores += d.scores;
      map.set(key, e);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  })();

  return (
    <DashCard className="h-80 flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          登録数推移 (直近90日)
        </h3>
        <div className="flex overflow-hidden rounded border border-bpim-border text-[10px]">
          {(["day", "week", "month"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-2 py-0.5 transition-colors ${
                groupBy === g
                  ? "bg-bpim-primary text-bpim-surface"
                  : "text-bpim-muted hover:bg-bpim-overlay"
              }`}
            >
              {g === "day" ? "日" : g === "week" ? "週" : "月"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={grouped}
            margin={{ top: 15, right: -30, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
              minTickGap={24}
            />
            <YAxis
              yAxisId="left"
              stroke={c.muted}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={c.primary}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: c.surface,
                border: `1px solid ${c.grid}`,
                borderRadius: 6,
                fontSize: 11,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="allScores"
              name="全難易度スコア"
              stroke={c.warning}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="scores"
              name="☆11,☆12スコア"
              stroke={c.danger}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="logs"
              name="バッチログ"
              stroke={c.primary}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}
