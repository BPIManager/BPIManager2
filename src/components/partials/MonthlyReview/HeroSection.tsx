"use client";

import { useEffect, useRef } from "react";
import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/pages/api/v1/users/[userId]/stats/monthly-review";
import dayjs from "@/lib/dayjs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useChartColors } from "@/hooks/common/useChartColors";

const styles = `
  @keyframes heroFade  { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes lineGrow  { from { transform:scaleX(0) } to { transform:scaleX(1) } }
  @keyframes numPop    { 0%{opacity:0;transform:scale(0.7)} 70%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
`;

interface Props {
  bpi: MonthlyReviewData["bpi"];
}

export const HeroSection = ({ bpi }: Props) => {
  const [ref, inView] = useInView(0.15);
  const colors = useChartColors();
  const rafRef = useRef<number | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const isPositive = bpi.diff >= 0;
  const accent = isPositive ? "#34d399" : "#f87171";

  useEffect(() => {
    if (!inView || !spanRef.current) return;
    const target = bpi.diff;
    const dur = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const v = e * target;
      if (spanRef.current)
        spanRef.current.textContent = (v >= 0 ? "+" : "") + v.toFixed(2);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, bpi.diff]);

  const chartData = bpi.history.map((h) => ({
    d: dayjs(h.date).format("M/D"),
    v: h.value,
  }));

  return (
    <>
      <style>{styles}</style>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
        className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6"
      >
        <h2
          className="mb-10 text-center font-black tracking-[0.2em] uppercase"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 2rem)",
            color: "rgba(255,255,255,0.5)",
            animation: inView ? "heroFade 0.6s ease-out both" : "none",
          }}
        >
          総合BPI
        </h2>

        <span
          ref={spanRef}
          className="font-black leading-none tabular-nums"
          style={{
            fontSize: "clamp(5rem, 20vw, 14rem)",
            color: accent,
            textShadow: `0 0 80px ${accent}66, 0 0 160px ${accent}33`,
            animation: inView ? "numPop 0.8s ease-out 0.2s both" : "none",
          }}
        >
          {isPositive ? "+" : ""}
          {(0).toFixed(2)}
        </span>

        <div
          className="my-8 h-px origin-left"
          style={{
            width: "min(320px, 60vw)",
            background: `linear-gradient(to right, transparent, ${accent}88, transparent)`,
            animation: inView ? "lineGrow 0.8s ease-out 0.5s both" : "none",
          }}
        />

        <div
          className="flex items-center gap-5 font-mono"
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "clamp(1rem, 3vw, 1.5rem)",
            animation: inView ? "heroFade 0.6s ease-out 0.65s both" : "none",
          }}
        >
          <span>{bpi.start.toFixed(2)}</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>──────►</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>
            {bpi.end.toFixed(2)}
          </span>
        </div>

        {chartData.length > 1 && (
          <div
            className="absolute bottom-0 w-full"
            style={{
              height: "32vh",
              animation: inView ? "heroFade 1s ease-out 0.9s both" : "none",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, transparent 0%, rgba(8,8,14,0.7) 30%, rgba(8,8,14,0.92) 100%)`,
              }}
            />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 36, right: 64, bottom: 24, left: 64 }}
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="d"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8,8,14,0.92)",
                    border: `1px solid ${accent}55`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#fff",
                  }}
                  formatter={(v) =>
                    [
                      typeof v === "number" ? v.toFixed(2) : String(v),
                      "BPI",
                    ] as [string, string]
                  }
                  cursor={{ stroke: `${accent}55`, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={(dotProps: Record<string, unknown>) => {
                    const { cx, cy, index } = dotProps as {
                      cx: number;
                      cy: number;
                      index: number;
                    };
                    const total = chartData.length;
                    const isFirst = index === 0;
                    const isLast = index === total - 1;
                    if (!isFirst && !isLast) return <g key={index} />;
                    const value = isFirst
                      ? chartData[0].v
                      : chartData[total - 1].v;
                    const label = value.toFixed(2);
                    const W = 56;
                    const H = 22;
                    // First label: right of dot; Last label: left of dot
                    const rx = isFirst ? cx - W / 2 : cx - W / 2;
                    const ry = cy - H - 8;
                    return (
                      <g key={index}>
                        <rect
                          x={rx}
                          y={ry}
                          width={W}
                          height={H}
                          rx={5}
                          fill="rgba(8,8,14,0.88)"
                          stroke={`${accent}66`}
                          strokeWidth={1}
                        />
                        <text
                          x={rx + W / 2}
                          y={ry + H / 2 + 4}
                          textAnchor="middle"
                          fill={accent}
                          fontSize={11}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {label}
                        </text>

                        <line
                          x1={cx}
                          y1={ry + H}
                          x2={cx}
                          y2={cy - 4}
                          stroke={`${accent}44`}
                          strokeWidth={1}
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={accent}
                          stroke="rgba(8,8,14,0.9)"
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }}
                  activeDot={{
                    r: 5,
                    fill: accent,
                    stroke: "rgba(8,8,14,0.8)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <p
          className="relative z-10 mt-8 max-w-md text-center text-sm leading-relaxed"
          style={{
            color: "rgba(255,255,255,0.35)",
            animation: inView ? "heroFade 0.6s ease-out 1.2s both" : "none",
          }}
        >
          {bpi.diff > 0
            ? `今月は ${bpi.start.toFixed(2)} から ${bpi.end.toFixed(2)} へ上昇し、+${bpi.diff.toFixed(2)} の成長を遂げました。`
            : bpi.diff < 0
              ? `今月は ${bpi.start.toFixed(2)} から ${bpi.end.toFixed(2)} へ変動しました。`
              : "今月の総合BPIに変動はありませんでした。"}
        </p>

        <div
          className="absolute bottom-8 flex flex-col items-center gap-1"
          style={{
            color: "rgba(255,255,255,0.2)",
            animation: inView ? "heroFade 1s ease-out 1.5s both" : "none",
          }}
        >
          {chartData.length <= 1 && (
            <>
              <div
                className="h-8 w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))",
                }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
};
