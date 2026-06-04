import { useTranslation } from "@/hooks/common/useTranslation";
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
import { NUM_TO_CLASS, MAX_CLASS_NUM, type ProcessedPoint } from "@/hooks/arena/useArenaHistory";

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

export interface ArenaChartProps {
  data: ProcessedPoint[];
  maxWinsDelta: number;
  hasRank: boolean;
  hasWins: boolean;
}

export function ArenaChart({ data, maxWinsDelta, hasRank, hasWins }: ArenaChartProps) {
  const { t } = useTranslation();

  const fmtTooltip = (v: unknown, name: unknown) => {
    if (name === "classNum")  return [NUM_TO_CLASS[v as number] ?? v, t("dashboard.arenaHistory.chart.class")];
    if (name === "rank")      return [(v as number).toLocaleString("ja-JP"), t("dashboard.arenaHistory.chart.rank")];
    if (name === "classRank") return [(v as number).toLocaleString("ja-JP"), t("dashboard.arenaHistory.chart.classRank")];
    if (name === "winsDelta") return [v, t("dashboard.arenaHistory.chart.wins")];
    return [v, name];
  };

  const fmtLegend = (value: string) => {
    if (value === "classNum")  return t("dashboard.arenaHistory.chart.class");
    if (value === "rank")      return t("dashboard.arenaHistory.chart.rank");
    if (value === "classRank") return t("dashboard.arenaHistory.chart.classRank");
    if (value === "winsDelta") return t("dashboard.arenaHistory.chart.wins");
    return value;
  };

  return (
    <div className="h-56 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 40, left: 0, bottom: 8 }}>
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
              domain={["auto", "auto"]}
              tick={TICK_PROPS}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v) => (v as number).toLocaleString("ja-JP")}
            />
          )}
          {hasWins && <YAxis yAxisId="wins" hide domain={[0, maxWinsDelta * 3]} />}

          <Tooltip {...CHART_STYLE} formatter={fmtTooltip as never} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} formatter={fmtLegend} />

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
          {hasRank && (
            <Line
              yAxisId="rank"
              type="monotone"
              dataKey="classRank"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ r: 3, fill: "#06b6d4" }}
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
  );
}
