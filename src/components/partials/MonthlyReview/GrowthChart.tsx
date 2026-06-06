"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { GrowthParticipant } from "@/pages/api/v1/users/[userId]/stats/monthly-review";
import dayjs from "@/lib/dayjs";

export const PALETTE = [
  "#ffffff",
  "#34d399",
  "#38bdf8",
  "#f59e0b",
  "#a78bfa",
  "#f87171",
  "#fb923c",
  "#4ade80",
  "#60a5fa",
];

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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, bottom: 0, left: -10 }}
      >
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `×${v.toFixed(2)}`}
          domain={["auto", "auto"]}
          width={44}
        />
        <ReferenceLine
          y={1}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="3 3"
        />
        <Tooltip
          contentStyle={{
            background: "rgba(8,8,14,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 11,
            color: "#fff",
          }}
          formatter={(v: unknown, name: unknown) => {
            const val = typeof v === "number" ? v : 0;
            const pct = ((val - 1) * 100).toFixed(1);
            const p = participants.find((x) => x.userId === name);
            const sign = Number(pct) >= 0 ? "+" : "";
            return [`${sign}${pct}%`, p?.userName ?? String(name)];
          }}
        />
        {keys.map((uid, i) => {
          if (hiddenKeys.has(uid)) return null;
          const p = participants.find((x) => x.userId === uid)!;
          const color = PALETTE[i] ?? PALETTE[PALETTE.length - 1];
          return (
            <Line
              key={uid}
              type="monotone"
              dataKey={uid}
              stroke={color}
              strokeWidth={p.isViewer ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 4, fill: color }}
              strokeOpacity={p.isViewer ? 1 : 0.7}
              connectNulls
              isAnimationActive
              animationDuration={1200}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};
