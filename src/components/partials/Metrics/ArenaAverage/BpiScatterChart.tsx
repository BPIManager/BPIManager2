"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { RadarCategory } from "@/types/stats/radar";
import type { ScatterPoint } from "@/hooks/metrics/useArenaAnalysis";
import { ALL_RADAR_CATEGORIES, RADAR_COLORS } from "@/constants/radars";

const ScatterTooltip = ({
  active,
  payload,
  rank,
}: {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
  rank: string;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const diff = d.userBpi - d.bpi;
  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-bg px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-bpim-text">{d.title}</p>
      <p className="text-bpim-muted">{d.difficulty}</p>
      <p className="mt-1 font-mono text-bpim-muted">
        {rank}平均BPI:{" "}
        <span className="text-bpim-text">{d.bpi.toFixed(2)}</span>
      </p>
      <p className="font-mono text-bpim-muted">
        自分のBPI:{" "}
        <span className="text-bpim-primary">{d.userBpi.toFixed(2)}</span>
      </p>
      <p
        className={cn(
          "font-mono font-bold",
          diff >= 0 ? "text-green-400" : "text-red-400",
        )}
      >
        差: {diff >= 0 ? "+" : ""}
        {diff.toFixed(2)}
      </p>
    </div>
  );
};

interface BpiScatterChartProps {
  rank: string;
  scatterPoints: ScatterPoint[];
  axisDomain: [number, number];
  rankColor: string;
  selectedCategories: Set<RadarCategory>;
  user: { userId: string } | null | undefined;
  userLoading: boolean;
}

export const BpiScatterChart = ({
  rank,
  scatterPoints,
  axisDomain,
  rankColor,
  selectedCategories,
  user,
  userLoading,
}: BpiScatterChartProps) => (
  <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
    <h3 className="mb-1 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
      {rank} 平均BPI vs 自分のBPI
    </h3>
    <p className="mb-4 text-[10px] text-bpim-muted">
      対角線より上 = このランク平均を上回っている曲 / 下 = 下回っている曲
      {!user && "（ログインすると自分のBPIと比較できます）"}
      {user && userLoading && "（読み込み中...）"}
      {user && !userLoading && scatterPoints.length === 0 &&
        "（このバージョンのスコアデータがありません）"}
    </p>

    {scatterPoints.length > 0 ? (
      <>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="bpi"
              type="number"
              name={`${rank}平均BPI`}
              domain={axisDomain}
              tick={{ fontSize: 10, fill: "#64748b" }}
              label={{
                value: `${rank} 平均BPI`,
                position: "insideBottom",
                offset: -15,
                fontSize: 10,
                fill: "#64748b",
              }}
            />
            <YAxis
              dataKey="userBpi"
              type="number"
              name="自分のBPI"
              domain={axisDomain}
              tick={{ fontSize: 10, fill: "#64748b" }}
              label={{
                value: "自分のBPI",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fontSize: 10,
                fill: "#64748b",
              }}
            />
            <ReferenceLine
              segment={[
                { x: axisDomain[0], y: axisDomain[0] },
                { x: axisDomain[1], y: axisDomain[1] },
              ]}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 4"
            />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Tooltip
              content={(props) => (
                <ScatterTooltip
                  active={props.active}
                  payload={
                    props.payload as unknown as { payload: ScatterPoint }[] | undefined
                  }
                  rank={rank}
                />
              )}
            />
            <Scatter
              data={scatterPoints}
              shape={(props: { cx?: number; cy?: number; payload?: ScatterPoint }) => {
                const entry = props.payload;
                if (!entry || props.cx == null || props.cy == null) return <g />;
                const above = entry.userBpi >= entry.bpi;
                const fill = above
                  ? (entry.radarCategory ? RADAR_COLORS[entry.radarCategory] : rankColor)
                  : "#ef4444";
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={fill}
                    fillOpacity={above ? 0.85 : 0.55}
                    stroke="none"
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-bpim-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 opacity-80" />
            ランク平均より上（カテゴリ色）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 opacity-60" />
            ランク平均より下
          </span>
          {ALL_RADAR_CATEGORIES.filter((c) => selectedCategories.has(c)).map(
            (c) => (
              <span key={c} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: RADAR_COLORS[c] }}
                />
                {c}
              </span>
            ),
          )}
        </div>
      </>
    ) : (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-bpim-border text-xs text-bpim-muted">
        {!user ? "ログインして自分のBPIと比較" : "データなし"}
      </div>
    )}
  </div>
);
