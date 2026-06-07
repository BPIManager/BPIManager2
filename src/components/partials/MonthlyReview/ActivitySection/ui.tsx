"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { formatDate } from "./functions";
import { useTranslation } from "@/hooks/common/useTranslation";

const styles = `
  @keyframes actFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes barGrowH { from{width:0} to{width:var(--w)} }
`;

interface Props {
  sectionRef: React.RefObject<HTMLDivElement>;
  inView: boolean;
  keysRef: React.RefObject<HTMLSpanElement | null>;
  scratchRef: React.RefObject<HTMLSpanElement | null>;
  daysRef: React.RefObject<HTMLSpanElement | null>;
  songsRef: React.RefObject<HTMLSpanElement | null>;
  summary: string;
  sectionTitle: string;
  activity: MonthlyReviewData["activity"];
  dowData: { label: string; count: number }[];
  hourData: { label: string; count: number }[];
  maxDow: number;
  tooltipStyle: React.CSSProperties;
  hasNoKeyScratchData: boolean;
  primaryColor: string;
  noKeyScratchTitle: string;
  noKeyScratchDesc: string;
  bestDaysTitle: string;
  bestGrowthDayLabel: string;
  bestKeysDayLabel: string;
  bestScratchDayLabel: string;
  byDayOfWeekTitle: string;
  byHourTitle: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatHourLabel: (...args: any[]) => React.ReactNode;
}

export const ActivitySectionUI = ({
  sectionRef,
  inView,
  keysRef,
  scratchRef,
  daysRef,
  songsRef,
  summary,
  sectionTitle,
  activity,
  dowData,
  hourData,
  maxDow,
  tooltipStyle,
  hasNoKeyScratchData,
  primaryColor,
  noKeyScratchTitle,
  noKeyScratchDesc,
  bestDaysTitle,
  bestGrowthDayLabel,
  bestKeysDayLabel,
  bestScratchDayLabel,
  byDayOfWeekTitle,
  byHourTitle,
  formatHourLabel,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const {
    totalKeys,
    totalScratches,
    playDays,
    updatedSongs,
    bestDays,
    towerRanking,
  } = activity;

  return (
    <>
      <style>{styles}</style>
      <section
        ref={sectionRef}
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
          {sectionTitle}
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
                  {noKeyScratchTitle}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                  }}
                >
                  {noKeyScratchDesc}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {[
                {
                  label: t("monthlyReview.activity.keys"),
                  value: totalKeys,
                  ref: keysRef,
                  accent: "#38bdf8",
                  rank: towerRanking?.keysRank,
                },
                {
                  label: t("monthlyReview.activity.scratches"),
                  value: totalScratches,
                  ref: scratchRef,
                  accent: "#a78bfa",
                  rank: towerRanking?.scratchRank,
                },
              ].map(({ label, value, ref: numRef, accent, rank }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[10px] font-bold tracking-[0.3em] uppercase"
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
                        {tFormat("monthlyReview.activity.rankOf", { rank: String(rank), total: String(towerRanking.totalUsers) })}
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
              { label: t("monthlyReview.activity.playDays"), ref: daysRef, value: playDays },
              { label: t("monthlyReview.activity.updatedSongs"), ref: songsRef, value: updatedSongs },
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
                {bestDaysTitle}
              </p>
              <div className="flex gap-2">
                {[
                  {
                    label: bestGrowthDayLabel,
                    date: bestDays.bestGrowthDay?.date ?? null,
                    sub: bestDays.bestGrowthDay
                      ? `+${bestDays.bestGrowthDay.bpiDiff.toFixed(2)} BPI`
                      : null,
                    accent: "#34d399",
                  },
                  {
                    label: bestKeysDayLabel,
                    date: bestDays.bestKeysDay?.date ?? null,
                    sub: bestDays.bestKeysDay
                      ? tFormat("monthlyReview.activity.keysCount", { count: bestDays.bestKeysDay.keyCount.toLocaleString() })
                      : null,
                    accent: "#38bdf8",
                  },
                  {
                    label: bestScratchDayLabel,
                    date: bestDays.bestScratchDay?.date ?? null,
                    sub: bestDays.bestScratchDay
                      ? tFormat("monthlyReview.activity.scratchCount", { count: bestDays.bestScratchDay.scratchCount.toLocaleString() })
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
              {byDayOfWeekTitle}
            </p>
            <div className="flex items-end gap-1.5" style={{ height: 164 }}>
              {dowData.map((d, i) => {
                const pct = d.count / maxDow;
                const isSat = i === 5;
                const isSun = i === 6;
                const barColor = isSat
                  ? "#38bdf8"
                  : isSun
                    ? "#f87171"
                    : primaryColor;
                return (
                  <div
                    key={d.label}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="flex w-full flex-col justify-end"
                      style={{ height: 128 }}
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
              {byHourTitle}
            </p>
            <ResponsiveContainer width="100%" height={128}>
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
                  formatter={(v) => [String(v), t("monthlyReview.updatedSongsUnit")] as [string, string]}
                  labelFormatter={formatHourLabel}
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
