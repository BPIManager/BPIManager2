import { useState } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RadarGrowthEntry } from "@/types/stats/monthlyReview";
import { ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatDate } from "../utils";
import { ELEMENT_LABELS, ELEMENT_COLORS, PAGE } from "./constants";
import SongRow from "./SongRow";

function ElementPanel({
  entry,
  inView,
}: {
  entry: RadarGrowthEntry;
  inView: boolean;
}) {
  const [visible, setVisible] = useState(PAGE);
  const { t, tFormat } = useTranslation();
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
        style={{ background: `${accent}18`, border: `1px solid ${accent}44` }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: `${accent}99` }}
          >
            {ELEMENT_LABELS[entry.element]}
          </span>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {tFormat("monthlyReview.radar.songsImproved", { count: String(entry.songs.length) })}
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
            {t("monthlyReview.radar.growthTimeline")}
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
                    t("monthlyReview.radar.growthRate"),
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
          {t("monthlyReview.seeMore")} ({entry.songs.length - visible})
        </button>
      )}

      <p
        className="text-center text-xs leading-relaxed"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {tFormat("monthlyReview.radar.elementSummary", {
          element: ELEMENT_LABELS[entry.element] ?? entry.element,
          count: String(entry.songs.length),
          start: entry.bpiStart.toFixed(2),
          end: entry.bpiEnd.toFixed(2),
          diff: `${totalDiff >= 0 ? "+" : ""}${totalDiff.toFixed(2)}`,
        })}
      </p>
    </div>
  );
}

export default ElementPanel;
