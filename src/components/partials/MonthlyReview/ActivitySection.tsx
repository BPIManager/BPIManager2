"use client";

import { useEffect, useRef } from "react";
import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { MonthlyReviewData } from "@/pages/api/v1/users/[userId]/stats/monthly-review";
import { useChartColors } from "@/hooks/common/useChartColors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

const styles = `
  @keyframes actFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes barGrowH { from{width:0} to{width:var(--w)} }
`;

function useCountUp(target: number, active: boolean, delay = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const startTime = performance.now() + delay * 1000;
    const step = (now: number) => {
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const p = Math.min((now - startTime) / 1200, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (ref.current)
        ref.current.textContent = Math.round(e * target).toLocaleString();
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target, delay]);
  return ref;
}

function formatDate(dateStr: string): string {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  return `${parseInt(m[2])}/${parseInt(m[3])}`;
}

interface Props {
  activity: MonthlyReviewData["activity"];
  granularity: "month" | "year";
}

export const ActivitySection = ({ activity, granularity }: Props) => {
  const [ref, inView] = useInView(0.1);
  const colors = useChartColors();
  const { t, tFormat } = useTranslation();
  const {
    totalKeys,
    totalScratches,
    playDays,
    updatedSongs,
    byDayOfWeek,
    byHour,
    bestDays,
  } = activity;

  const keysRef = useCountUp(totalKeys, inView, 0.2);
  const scratchRef = useCountUp(totalScratches, inView, 0.35);
  const daysRef = useCountUp(playDays, inView, 0.5);
  const songsRef = useCountUp(updatedSongs, inView, 0.6);

  const { towerRanking } = activity;
  const dowLabels = t("monthlyReview.activity.dowLabels").split(",");
  const dowData = byDayOfWeek.map((d) => ({
    label: dowLabels[d.day] ?? String(d.day),
    count: d.count,
  }));
  const hourData = byHour.map((h) => ({
    label: String(h.hour),
    count: h.count,
  }));
  const maxDow = Math.max(...dowData.map((d) => d.count), 1);

  const tooltipStyle = {
    background: "rgba(8,8,14,0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    fontSize: 11,
    color: "#ffffff",
  };

  const isMonth = granularity === "month";
  const bestDowIdx = dowData.reduce(
    (best, d, i) => (d.count > dowData[best].count ? i : best),
    0,
  );
  const bestDowLabel = dowLabels[bestDowIdx] ?? "";
  const summaryParts: string[] = [
    tFormat("monthlyReview.activity.summaryPlayed", {
      days: playDays,
      songs: updatedSongs,
    }),
    tFormat("monthlyReview.activity.summaryBestDow", {
      day: isMonth ? `${bestDowLabel}曜` : bestDowLabel,
    }),
  ];
  if (towerRanking) {
    summaryParts.push(
      tFormat("monthlyReview.activity.summaryKeysRank", {
        rank: towerRanking.keysRank,
        total: towerRanking.totalUsers,
      }),
    );
  }
  const summary = summaryParts.join(" ");

  const hasNoKeyScratchData = totalKeys === 0 && totalScratches === 0;

  return (
    <>
      <style>{styles}</style>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-24"
      >
        <h2
          className="mb-12 text-center font-black tracking-[0.2em] uppercase"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 2rem)",
            color: "rgba(255,255,255,0.5)",
            animation: inView ? "actFade 0.6s ease-out both" : "none",
          }}
        >
          {t("monthlyReview.activity.sectionTitle")}
        </h2>

        <p
          className="mb-8 text-center text-xs"
          style={{
            color: "rgba(255,255,255,0.25)",
            animation: inView ? "radarFade 0.6s ease-out 0.1s both" : "none",
          }}
        >
          {summary}
        </p>

        <div
          className="w-full max-w-3xl rounded-3xl px-6 py-8 sm:px-10"
          style={{
            background: "rgba(8,8,14,0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
            animation: inView ? "actFade 0.6s ease-out 0.1s both" : "none",
          }}
        >
          {hasNoKeyScratchData ? (
            <div
              className="flex flex-col items-center gap-3 py-6 text-center"
              style={{
                animation: inView ? "actFade 0.6s ease-out 0.2s both" : "none",
              }}
            >
              <div
                className="rounded-2xl px-6 py-5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p
                  className="mb-1 font-bold"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "0.875rem",
                  }}
                >
                  {t("monthlyReview.activity.noKeyScratchTitle")}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                  }}
                >
                  {t("monthlyReview.activity.noKeyScratchDesc")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {[
                {
                  label: "KEYS PRESSED",
                  value: totalKeys,
                  ref: keysRef,
                  accent: "#38bdf8",
                  rank: towerRanking?.keysRank,
                },
                {
                  label: "SCRATCHES",
                  value: totalScratches,
                  ref: scratchRef,
                  accent: "#a78bfa",
                  rank: towerRanking?.scratchRank,
                },
              ].map(({ label, value, ref: numRef, accent, rank }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[10px] font-bold tracking-[0.3em]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {label}
                    </p>
                    {rank != null && towerRanking && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                        style={{
                          background: `${accent}18`,
                          color: accent,
                          border: `1px solid ${accent}44`,
                        }}
                      >
                        {rank}位 / {towerRanking.totalUsers}人
                      </span>
                    )}
                  </div>
                  <span
                    ref={numRef}
                    className="font-black tabular-nums leading-none"
                    style={{
                      fontSize: "clamp(2.5rem, 8vw, 5rem)",
                      color: accent,
                      textShadow: `0 0 40px ${accent}44`,
                    }}
                  >
                    0
                  </span>
                  <div
                    className="h-0.5 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={
                        {
                          "--w": `${Math.min((value / Math.max(totalKeys, totalScratches, 1)) * 100, 100)}%`,
                          background: `linear-gradient(to right, ${accent}77, ${accent})`,
                          animation: inView
                            ? `barGrowH 1s ease-out 0.4s both`
                            : "none",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="mt-6 flex items-center justify-around border-t pt-6"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            {[
              { label: "PLAY DAYS", ref: daysRef, value: playDays },
              { label: "UPDATED SONGS", ref: songsRef, value: updatedSongs },
            ].map(({ label, ref: numRef }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span
                  ref={numRef}
                  className="font-black tabular-nums"
                  style={{
                    fontSize: "clamp(1.8rem, 5vw, 3rem)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  0
                </span>
                <span
                  className="text-[10px] tracking-widest"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {bestDays && (
            <div
              className="mt-6 border-t pt-6"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                animation: inView ? "actFade 0.6s ease-out 0.45s both" : "none",
              }}
            >
              <p
                className="mb-4 text-[10px] font-bold tracking-[0.3em] uppercase"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {t("monthlyReview.activity.bestDaysTitle")}
              </p>
              <div className="flex gap-2">
                {[
                  {
                    label: t("monthlyReview.activity.bestGrowthDay"),
                    date: bestDays.bestGrowthDay?.date ?? null,
                    sub: bestDays.bestGrowthDay
                      ? `+${bestDays.bestGrowthDay.bpiDiff.toFixed(2)} BPI`
                      : null,
                    accent: "#34d399",
                  },
                  {
                    label: t("monthlyReview.activity.bestKeysDay"),
                    date: bestDays.bestKeysDay?.date ?? null,
                    sub: bestDays.bestKeysDay
                      ? `${bestDays.bestKeysDay.keyCount.toLocaleString()} 打`
                      : null,
                    accent: "#38bdf8",
                  },
                  {
                    label: t("monthlyReview.activity.bestScratchDay"),
                    date: bestDays.bestScratchDay?.date ?? null,
                    sub: bestDays.bestScratchDay
                      ? `${bestDays.bestScratchDay.scratchCount.toLocaleString()} 回`
                      : null,
                    accent: "#a78bfa",
                  },
                ].map(({ label, date, sub, accent }) => (
                  <div
                    key={label}
                    className="flex flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-3"
                    style={{
                      background: `${accent}0a`,
                      border: `1px solid ${accent}22`,
                    }}
                  >
                    <span
                      className="text-center text-[9px] font-bold tracking-widest"
                      style={{ color: `${accent}99` }}
                    >
                      {label}
                    </span>
                    {date ? (
                      <>
                        <span
                          className="text-base font-black tabular-nums"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {formatDate(date)}
                        </span>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: accent }}
                        >
                          {sub}
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-sm"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        —
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="mt-8 border-t pt-6"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              animation: inView ? "actFade 0.6s ease-out 0.5s both" : "none",
            }}
          >
            <p
              className="mb-3 text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {t("monthlyReview.activity.byDayOfWeek")}
            </p>
            <div className="flex items-end gap-1.5" style={{ height: 64 }}>
              {dowData.map((d, i) => {
                const pct = d.count / maxDow;
                const isSat = i === 5;
                const isSun = i === 6;
                const barColor = isSat
                  ? "#38bdf8"
                  : isSun
                    ? "#f87171"
                    : colors.primary;
                return (
                  <div
                    key={d.label}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="flex w-full flex-col justify-end"
                      style={{ height: 48 }}
                    >
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${Math.max(pct * 100, d.count > 0 ? 8 : 0)}%`,
                          background: barColor,
                          opacity: 0.75,
                          transition: "height 0.8s ease-out",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px]"
                      style={{
                        color: isSun
                          ? "#f87171"
                          : isSat
                            ? "#38bdf8"
                            : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="mt-6 border-t pt-6"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              animation: inView ? "actFade 0.6s ease-out 0.65s both" : "none",
            }}
          >
            <p
              className="mb-3 text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {t("monthlyReview.activity.byHour")}
            </p>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart
                data={hourData}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                barCategoryGap="15%"
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    ["0", "6", "12", "18", "23"].includes(v) ? v : ""
                  }
                  interval={0}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  wrapperStyle={{ zIndex: 50 }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v) => [String(v), "曲"] as [string, string]}
                  labelFormatter={(l) =>
                    tFormat("monthlyReview.activity.hourUnit", { h: l })
                  }
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {hourData.map((d, i) => {
                    const h = d.label === "" ? i : Number(d.label);
                    const color =
                      h < 6
                        ? "#6366f1"
                        : h < 12
                          ? "#f59e0b"
                          : h < 18
                            ? "#34d399"
                            : "#a78bfa";
                    return <Cell key={i} fill={color} fillOpacity={0.75} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </>
  );
};
