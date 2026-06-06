"use client";

import { useState } from "react";
import { useInView } from "@/hooks/common/useInView";
import type {
  MonthlyReviewData,
  TopSongImproved,
  RadarGrowthEntry,
} from "@/pages/api/v1/users/[userId]/stats/monthly-review";
import { ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

const styles = `
  @keyframes radarFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes radarRow  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes titleIn   { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
`;

const ELEMENT_LABELS: Record<string, string> = {
  NOTES: "NOTES",
  CHORD: "CHORD",
  PEAK: "PEAK",
  CHARGE: "CHARGE",
  SCRATCH: "SCRATCH",
  SOFLAN: "SOFLAN",
};
const ELEMENT_COLORS: Record<string, string> = {
  NOTES: "#38bdf8",
  CHORD: "#a78bfa",
  PEAK: "#f59e0b",
  CHARGE: "#34d399",
  SCRATCH: "#f87171",
  SOFLAN: "#fb923c",
};

const DIFF_COLORS: Record<string, string> = {
  HYPER: "#f59e0b",
  ANOTHER: "#ef4444",
  LEGGENDARIA: "#a855f7",
};
const DIFF_LABELS: Record<string, string> = {
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};

const PAGE = 5;

function formatDate(dateStr: string): string {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  return `${parseInt(m[2])}/${parseInt(m[3])}`;
}

function SongRow({
  rank,
  song,
  accent,
  delay,
}: {
  rank: number;
  song: TopSongImproved;
  accent: string;
  delay: number;
}) {
  const diffColor = DIFF_COLORS[song.difficulty] ?? "#94a3b8";
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        animation: `radarRow 0.4s ease-out ${delay}s both`,
      }}
    >
      <span
        className="w-6 shrink-0 text-right text-xs font-black tabular-nums"
        style={{ color: rank <= 3 ? accent : "rgba(255,255,255,0.2)" }}
      >
        {rank}
      </span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black"
        style={{ background: `${diffColor}22`, color: diffColor }}
      >
        {DIFF_LABELS[song.difficulty] ?? song.difficulty}
      </span>
      <span
        className="flex-1 truncate text-sm font-semibold"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        {song.title}
      </span>
      <span
        className="shrink-0 font-mono text-xs tabular-nums"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {song.bpiBefore.toFixed(2)}
      </span>
      <span
        className="shrink-0 text-[10px]"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        →
      </span>
      <span
        className="shrink-0 font-mono text-sm font-bold tabular-nums"
        style={{ color: accent }}
      >
        {song.bpiAfter.toFixed(2)}
      </span>
      <span
        className="shrink-0 text-xs font-bold"
        style={{ color: `${accent}cc` }}
      >
        +{song.diff.toFixed(2)}
      </span>
    </div>
  );
}

function ElementPanel({
  entry,
  inView,
}: {
  entry: RadarGrowthEntry;
  inView: boolean;
}) {
  const [visible, setVisible] = useState(PAGE);
  const accent = ELEMENT_COLORS[entry.element] ?? "#94a3b8";
  const totalDiff = entry.totalDiff;

  const chartData = [
    { d: "月初", v: 1 },
    ...entry.timeline.map((t) => ({
      d: formatDate(t.date),
      v:
        totalDiff > 0 ? Math.round((1 + t.cumDiff / totalDiff) * 100) / 100 : 1,
    })),
  ];

  const tooltipStyle = {
    background: "rgba(8,8,14,0.92)",
    border: `1px solid ${accent}44`,
    borderRadius: 8,
    fontSize: 11,
    color: "#fff",
  };

  const diffPositive = totalDiff >= 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4"
        style={{ background: `${accent}0d`, border: `1px solid ${accent}22` }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: `${accent}99` }}
          >
            {ELEMENT_LABELS[entry.element]}
          </span>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {entry.songs.length} 曲が伸びました
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className="flex items-center gap-2 font-mono text-sm tabular-nums"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <span>{entry.bpiStart.toFixed(2)}</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
            <span style={{ color: accent }}>{entry.bpiEnd.toFixed(2)}</span>
          </div>
          <span
            className="font-mono text-lg font-black tabular-nums"
            style={{ color: diffPositive ? accent : "#f87171" }}
          >
            {diffPositive ? "+" : ""}
            {totalDiff.toFixed(2)}
          </span>
        </div>
      </div>

      {chartData.length > 2 && (
        <div
          style={{
            animation: inView ? "radarFade 0.6s ease-out 0.3s both" : "none",
          }}
        >
          <p
            className="mb-2 text-[10px] font-bold tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            成長推移
          </p>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
            >
              <XAxis
                dataKey="d"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[1, "auto"]}
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                width={28}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: `${accent}44`, strokeWidth: 1 }}
                formatter={(v) =>
                  [
                    typeof v === "number" ? `×${v.toFixed(2)}` : String(v),
                    "成長率",
                  ] as [string, string]
                }
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={accent}
                strokeWidth={2}
                dot={{
                  fill: accent,
                  r: 3,
                  stroke: "rgba(8,8,14,0.9)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: accent,
                  stroke: "rgba(8,8,14,0.8)",
                  strokeWidth: 2,
                }}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {entry.songs.slice(0, visible).map((s, i) => (
          <SongRow
            key={s.songId}
            rank={i + 1}
            song={s}
            accent={accent}
            delay={i * 0.04}
          />
        ))}
      </div>
      {visible < entry.songs.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-colors"
          style={{ color: `${accent}99`, border: `1px dashed ${accent}33` }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = `${accent}0d`)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ChevronDown className="h-3.5 w-3.5" />
          もっとみる ({entry.songs.length - visible})
        </button>
      )}

      <p
        className="text-center text-xs leading-relaxed"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {`${ELEMENT_LABELS[entry.element]}カテゴリでは ${entry.songs.length} 曲が伸び、総合BPI ${entry.bpiStart.toFixed(2)} → ${entry.bpiEnd.toFixed(2)} (${totalDiff >= 0 ? "+" : ""}${totalDiff.toFixed(2)}) の変化でした。`}
      </p>
    </div>
  );
}

function RadarComparisonChart({
  entries,
  inView,
}: {
  entries: RadarGrowthEntry[];
  inView: boolean;
}) {
  if (entries.length < 3) return null;

  const radarData = entries.map((e) => {
    const diff = e.totalDiff;
    const rawGrowth = e.totalDiff / Math.max(Math.abs(e.bpiStart), 5);

    const growthRate = Math.pow(1 + Math.max(rawGrowth, 0), 2);

    return {
      subject: ELEMENT_LABELS[e.element] ?? e.element,
      element: e.element,

      start: 1,
      end: growthRate,

      growthPct: rawGrowth * 100,

      bpiStart: e.bpiStart,
      bpiEnd: e.bpiEnd,
      diff,
    };
  });

  const maxGrowth = Math.max(...radarData.map((d) => d.end), 1.1);
  const domain: [number, number] = [0, Math.ceil(maxGrowth * 10) / 10 + 0.1];

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof radarData)[0] }>;
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const color = ELEMENT_COLORS[d.element] ?? "#94a3b8";
    const growthPct = d.growthPct.toFixed(1);
    const sign = d.diff >= 0 ? "+" : "";
    return (
      <div
        style={{
          background: "rgba(8,8,14,0.92)",
          border: `1px solid ${color}55`,
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 11,
          minWidth: 140,
        }}
      >
        <p style={{ color, fontWeight: "bold", marginBottom: 6 }}>
          {d.subject}
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
          伸び率:{" "}
          <span
            style={{
              color: d.end >= 1 ? color : "#f87171",
              fontWeight: "bold",
            }}
          >
            {d.end >= 1 ? "+" : ""}
            {growthPct}%
          </span>
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
          伸び（絶対値）:{" "}
          <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: "bold" }}>
            {sign}
            {d.diff.toFixed(2)}
          </span>
        </p>
        <p
          style={{ color: "rgba(255,255,255,0.3)", marginTop: 4, fontSize: 10 }}
        >
          {d.bpiStart.toFixed(2)}{" "}
          <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>{" "}
          <span style={{ color }}>{d.bpiEnd.toFixed(2)}</span>
        </p>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-lg mx-auto"
      style={{
        animation: inView ? "radarFade 0.7s ease-out 0.25s both" : "none",
      }}
    >
      <p
        className="mb-1 text-center text-[10px] font-bold tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        各要素の成長
      </p>
      <ResponsiveContainer width="100%" height={520}>
        <RadarChart
          data={radarData}
          margin={{ top: 16, right: 48, bottom: 16, left: 48 }}
        >
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={(props) => {
              const { x, y, payload } = props as unknown as {
                x: number;
                y: number;
                cx: number;
                cy: number;
                payload: { value: string };
              };
              const element = entries.find(
                (e) =>
                  (ELEMENT_LABELS[e.element] ?? e.element) === payload.value,
              );
              const color = element
                ? (ELEMENT_COLORS[element.element] ?? "#94a3b8")
                : "#94a3b8";
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color}
                  fontSize={11}
                  fontWeight="bold"
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis domain={domain} tick={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="期間前"
            dataKey="start"
            stroke="rgba(255,255,255,0.2)"
            fill="rgba(255,255,255,0.04)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
          <Radar
            name="期間後"
            dataKey="end"
            stroke="rgba(255,255,255,0.6)"
            fill="rgba(255,255,255,0.0)"
            strokeWidth={2}
            dot={({ cx, cy, payload }) => {
              const element = entries.find(
                (e) =>
                  (ELEMENT_LABELS[e.element] ?? e.element) === payload.subject,
              );
              const color = element
                ? (ELEMENT_COLORS[element.element] ?? "#94a3b8")
                : "#94a3b8";
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke="rgba(8,8,14,0.8)"
                  strokeWidth={1.5}
                />
              );
            }}
          />
          <Legend
            iconSize={8}
            iconType="circle"
            wrapperStyle={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              paddingTop: 4,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  radarGrowth: MonthlyReviewData["radarGrowth"];
}

export const RadarSection = ({ radarGrowth }: Props) => {
  const [ref, inView] = useInView(0.1);
  const [activeTab, setActiveTab] = useState(0);

  if (!radarGrowth || radarGrowth.length === 0) return null;

  const sortedAll = [...radarGrowth].sort((a, b) => b.totalDiff - a.totalDiff);
  const sortedWithSongs = sortedAll.filter((e) => e.songs.length > 0);
  const currentEntry = sortedWithSongs[activeTab] ?? sortedWithSongs[0];

  return (
    <>
      <style>{styles}</style>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-24"
      >
        <h2
          className="mb-4 text-center font-black tracking-[0.2em] uppercase"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 2rem)",
            color: "rgba(255,255,255,0.5)",
            animation: inView ? "titleIn 0.8s ease-out both" : "none",
          }}
        >
          レーダー別成長
        </h2>
        <p
          className="mb-8 text-center text-xs"
          style={{
            color: "rgba(255,255,255,0.25)",
            animation: inView ? "radarFade 0.6s ease-out 0.1s both" : "none",
          }}
        >
          今月伸びた曲をレーダー要素別に集計しました
        </p>

        <RadarComparisonChart entries={sortedAll} inView={inView} />

        {sortedWithSongs.length > 0 && (
          <>
            <div
              className="mt-10 mb-8 flex flex-wrap justify-center gap-2"
              style={{
                animation: inView
                  ? "radarFade 0.6s ease-out 0.35s both"
                  : "none",
              }}
            >
              {sortedWithSongs.map((entry, i) => {
                const accent = ELEMENT_COLORS[entry.element] ?? "#94a3b8";
                const isActive = i === activeTab;
                return (
                  <button
                    key={entry.element}
                    onClick={() => setActiveTab(i)}
                    className="rounded-full px-4 py-1.5 text-xs font-bold transition-all"
                    style={{
                      background: isActive ? `${accent}22` : "transparent",
                      border: `1px solid ${isActive ? accent : `${accent}44`}`,
                      color: isActive ? accent : `${accent}77`,
                    }}
                  >
                    {ELEMENT_LABELS[entry.element]}
                    <span className="ml-1.5 opacity-70">
                      {entry.totalDiff >= 0 ? "+" : ""}
                      {entry.totalDiff.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="w-full max-w-2xl rounded-3xl px-6 py-8 sm:px-8"
              style={{
                background: "rgba(8,8,14,0.55)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.07)",
                animation: inView
                  ? "radarFade 0.6s ease-out 0.45s both"
                  : "none",
              }}
            >
              {currentEntry && (
                <ElementPanel
                  key={currentEntry.element}
                  entry={currentEntry}
                  inView={inView}
                />
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
};
