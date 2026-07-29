"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ChevronDown } from "lucide-react";
import type {
  MonthlyReviewData,
  RivalBpiGrowthEntry,
  RivalSongHighlight,
} from "@/types/stats/monthlyReview";
import { GrowthChart, PALETTE } from "../GrowthChart";
import { SectionCard } from "../SectionCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const styles = `
  @keyframes rivalIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes songIn  { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes titleIn { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
  @keyframes chartFade { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
`;

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

const SongRow = ({
  song,
  delay,
}: {
  song: RivalSongHighlight;
  delay: number;
}) => (
  <div
    className="flex items-center gap-2"
    style={{ animation: `songIn 0.4s ease-out ${delay}s both` }}
  >
    <span
      className="shrink-0 rounded px-1 py-0.5 text-[9px] font-black"
      style={{
        background: `${DIFF_COLORS[song.difficulty] ?? "#94a3b8"}22`,
        color: DIFF_COLORS[song.difficulty] ?? "#94a3b8",
      }}
    >
      {DIFF_LABELS[song.difficulty] ?? song.difficulty}
    </span>
    <span
      className="flex-1 truncate text-xs"
      style={{ color: "rgba(255,255,255,0.6)" }}
    >
      {song.title}
    </span>
    <span
      className="shrink-0 font-mono text-[10px] tabular-nums"
      style={{ color: "rgba(255,255,255,0.5)" }}
    >
      {song.userExScore}
    </span>
    <span
      className="shrink-0 text-[9px]"
      style={{ color: "rgba(255,255,255,0.2)" }}
    >
      vs
    </span>
    <span
      className="shrink-0 font-mono text-[10px] tabular-nums"
      style={{ color: "rgba(255,255,255,0.35)" }}
    >
      {song.rivalExScore}
    </span>
    <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-400">
      +{song.margin}
    </span>
  </div>
);

function GrowthRankList({
  title,
  entries,
  valueKey,
  formatValue,
}: {
  title: string;
  entries: RivalBpiGrowthEntry[];
  valueKey: "bpiGrowth" | "growthRate";
  formatValue: (e: RivalBpiGrowthEntry) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[10px] font-bold tracking-[0.25em] uppercase"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {title}
      </p>
      {entries.map((e, i) => {
        const isPositive = (e[valueKey] ?? 0) >= 0;
        const accent = isPositive ? "#34d399" : "#f87171";
        return (
          <div
            key={e.userId}
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: e.isViewer
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.02)",
              border: e.isViewer
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              className="w-5 shrink-0 text-right text-xs font-black tabular-nums"
              style={{ color: i < 3 ? accent : "rgba(255,255,255,0.2)" }}
            >
              {i + 1}
            </span>
            <span
              className="flex-1 truncate text-xs font-semibold"
              style={{
                color: e.isViewer
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.65)",
              }}
            >
              {e.userName}
              {e.isViewer && (
                <span
                  className="ml-1.5 text-[9px] font-bold"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  YOU
                </span>
              )}
            </span>
            <span
              className="shrink-0 font-mono text-xs font-bold tabular-nums"
              style={{ color: accent }}
            >
              {formatValue(e)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const SONG_PAGE = 3;

function RivalSongs({
  songs,
  baseDelay,
}: {
  songs: RivalSongHighlight[];
  baseDelay: number;
}) {
  const [visible, setVisible] = useState(SONG_PAGE);
  const { tFormat } = useTranslation();
  return (
    <div
      className="mt-4 flex flex-col gap-2 border-t pt-4"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      {songs.slice(0, visible).map((song, j) => (
        <SongRow
          key={song.songId}
          song={song}
          delay={baseDelay + j * 0.05 + 0.15}
        />
      ))}
      {visible < songs.length && (
        <button
          onClick={() => setVisible((v) => v + SONG_PAGE)}
          className="mt-1 flex items-center gap-1 text-[10px] font-bold transition-colors"
          style={{ color: "rgba(255,255,255,0.25)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.25)")
          }
        >
          <ChevronDown className="h-3 w-3" />
          {tFormat("monthlyReview.rivals.seeMoreSongs", { count: String(songs.length - visible) })}
        </button>
      )}
    </div>
  );
}

const PAGE = 3;

interface Props {
  rivals: MonthlyReviewData["rivals"];
  ranking: MonthlyReviewData["rivalsGrowthRanking"];
  timeline: MonthlyReviewData["rivalsGrowthTimeline"];
  granularity: "month" | "year";
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  isEmpty: boolean;
  hasChart: boolean;
  hiddenKeys: Set<string>;
  viewerAbsRank: number;
  viewerRateRank: number;
  totalParticipants: number;
  onToggleKey: (uid: string) => void;
  noRivalsTitle: string;
  noRivalsDesc: string;
  sectionTitle: string;
  rivalsSummary: string;
}

export const RivalsSectionUI = ({
  rivals,
  ranking,
  timeline,
  granularity,
  inView,
  sectionRef,
  isEmpty,
  hasChart,
  hiddenKeys,
  viewerAbsRank,
  viewerRateRank,
  totalParticipants,
  onToggleKey,
  noRivalsTitle,
  noRivalsDesc,
  sectionTitle,
  rivalsSummary,
}: Props) => {
  const [visible, setVisible] = useState(PAGE);
  const { t } = useTranslation();

  return (
    <>
      <style>{styles}</style>
      <section
        ref={sectionRef}
        className="relative w-full"
      >
        <div className="flex min-h-[30vh] w-full flex-col items-center justify-end pb-8 pt-24">
          <h2
            className="text-center font-black tracking-[0.2em] uppercase"
            style={{
              fontSize: "clamp(1.25rem, 4vw, 2rem)",
              color: "rgba(255,255,255,0.5)",
              animation: inView ? "titleIn 0.8s ease-out both" : "none",
            }}
          >
            {sectionTitle}
          </h2>
          {!isEmpty && rivals.length > 0 && (
            <p
              className="mt-8 max-w-lg text-center text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {rivalsSummary}
            </p>
          )}
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center gap-3 px-5 pb-24 text-center">
            <div
              className="w-full max-w-md rounded-2xl px-8 py-8"
              style={{
                background: "rgba(8,8,14,0.55)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className="mb-2 font-bold"
                style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}
              >
                {noRivalsTitle}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: "0.8rem",
                  lineHeight: 1.65,
                }}
              >
                {noRivalsDesc}
              </p>
            </div>
          </div>
        )}

        {!isEmpty && hasChart && (
          <div
            className="relative w-full overflow-hidden"
            style={{
              animation: inView ? "chartFade 0.8s ease-out 0.2s both" : "none",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: [
                  "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(56,189,248,0.07) 0%, transparent 70%)",
                  "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(167,139,250,0.06) 0%, transparent 70%)",
                  "radial-gradient(ellipse 50% 50% at 50% 90%, rgba(52,211,153,0.05) 0%, transparent 70%)",
                  "linear-gradient(to bottom, rgba(8,8,14,0.7) 0%, rgba(8,8,14,0.2) 40%, rgba(8,8,14,0.2) 60%, rgba(8,8,14,0.85) 100%)",
                ].join(", "),
              }}
            />

            <div className="relative px-4 pb-4 pt-6 sm:px-10">
              {totalParticipants > 1 &&
                (viewerRateRank >= 0 || viewerAbsRank >= 0) && (
                  <div className="mb-6 flex flex-wrap justify-center gap-8">
                    {viewerAbsRank >= 0 && (
                      <div className="flex flex-col items-center text-center">
                        <p
                          className="mb-0.5 text-[10px] uppercase tracking-widest"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          {t("monthlyReview.rivals.bpiGrowthRank")}
                        </p>
                        <p
                          className="font-black tabular-nums leading-none"
                          style={{
                            fontSize: "clamp(2rem, 6vw, 3.5rem)",
                            color: "#34d399",
                          }}
                        >
                          {viewerAbsRank + 1}
                          <span
                            className="ml-1 text-base font-bold"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            / {totalParticipants}
                          </span>
                        </p>
                      </div>
                    )}
                    {viewerRateRank >= 0 && (
                      <div className="flex flex-col items-center text-center">
                        <p
                          className="mb-0.5 text-[10px] uppercase tracking-widest"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          {t("monthlyReview.rivals.growthRateRank")}
                        </p>
                        <p
                          className="font-black tabular-nums leading-none"
                          style={{
                            fontSize: "clamp(2rem, 6vw, 3.5rem)",
                            color: "#38bdf8",
                          }}
                        >
                          {viewerRateRank + 1}
                          <span
                            className="ml-1 text-base font-bold"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            / {ranking!.byGrowthRate.length}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p
                  className="text-xs font-bold tracking-[0.3em] uppercase"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {t("monthlyReview.rivals.growthTimeline")}
                </p>
              </div>

              <div className="mb-4 flex flex-wrap gap-3">
                {timeline!.map((p, i) => {
                  const color = PALETTE[i] ?? PALETTE[PALETTE.length - 1];
                  const hidden = hiddenKeys.has(p.userId);
                  return (
                    <button
                      key={p.userId}
                      onClick={() => onToggleKey(p.userId)}
                      className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] transition-all"
                      style={{
                        color: hidden
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(255,255,255,0.65)",
                        background: hidden ? "transparent" : `${color}14`,
                        border: `1px solid ${hidden ? "rgba(255,255,255,0.06)" : `${color}40`}`,
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-4 rounded-full"
                        style={{
                          background: hidden ? "rgba(255,255,255,0.15)" : color,
                          opacity: p.isViewer ? 1 : 0.8,
                        }}
                      />
                      {p.userName}
                    </button>
                  );
                })}
              </div>

              <GrowthChart
                participants={timeline!}
                hiddenKeys={hiddenKeys}
                granularity={granularity}
              />
            </div>
          </div>
        )}

        {!isEmpty && (
          <div className="flex w-full flex-col items-center px-6 py-10">
            <SectionCard
              className="max-w-2xl flex flex-col gap-8"
              style={{
                animation: inView ? "rivalIn 0.5s ease-out 0.1s both" : "none",
              }}
            >
              {ranking && (
                <div>
                  <p
                    className="mb-4 text-xs font-bold tracking-[0.3em] uppercase"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {t("monthlyReview.rivals.growthRanking")}
                  </p>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <GrowthRankList
                      title={t("monthlyReview.rivals.growthAbsTitle")}
                      entries={ranking.byAbsGrowth}
                      valueKey="bpiGrowth"
                      formatValue={(e) =>
                        `${e.bpiGrowth >= 0 ? "+" : ""}${e.bpiGrowth.toFixed(2)}`
                      }
                    />
                    {ranking.byGrowthRate.length > 0 && (
                      <GrowthRankList
                        title={t("monthlyReview.rivals.growthRateTitle")}
                        entries={ranking.byGrowthRate}
                        valueKey="growthRate"
                        formatValue={(e) =>
                          `${(e.growthRate ?? 0) >= 0 ? "+" : ""}${(e.growthRate ?? 0).toFixed(1)}%`
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {rivals.slice(0, visible).map((rival, i) => (
                  <div
                    key={rival.userId}
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      animation: inView
                        ? `rivalIn 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s both`
                        : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                          src={rival.profileImage ?? ""}
                          alt={rival.userName}
                        />
                        <AvatarFallback
                          className="text-xs"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {rival.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="flex-1 truncate font-bold"
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "1rem",
                        }}
                      >
                        {rival.userName}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {rival.bpiGrowth !== null && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{
                              background:
                                rival.bpiGrowth >= 0
                                  ? "rgba(52,211,153,0.1)"
                                  : "rgba(248,113,113,0.1)",
                              color:
                                rival.bpiGrowth >= 0 ? "#34d399" : "#f87171",
                              border: `1px solid ${rival.bpiGrowth >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                            }}
                          >
                            BPI {rival.bpiGrowth >= 0 ? "+" : ""}
                            {rival.bpiGrowth.toFixed(2)}
                          </span>
                        )}
                        {rival.newWins > 0 && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black"
                            style={{
                              background: "rgba(52,211,153,0.15)",
                              color: "#34d399",
                              border: "1px solid rgba(52,211,153,0.3)",
                            }}
                          >
                            ↑{rival.newWins} WIN
                          </span>
                        )}
                        {rival.newLosses > 0 && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black"
                            style={{
                              background: "rgba(248,113,113,0.15)",
                              color: "#f87171",
                              border: "1px solid rgba(248,113,113,0.3)",
                            }}
                          >
                            ↓{rival.newLosses} LOSE
                          </span>
                        )}
                      </div>
                    </div>
                    {rival.topWinningSongs.length > 0 && (
                      <RivalSongs
                        songs={rival.topWinningSongs}
                        baseDelay={i * 0.1}
                      />
                    )}
                  </div>
                ))}

                {visible < rivals.length && (
                  <button
                    onClick={() => setVisible((v) => v + PAGE)}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-colors"
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      border: "1px dashed rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    {t("monthlyReview.seeMore")} ({rivals.length - visible})
                  </button>
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </section>
    </>
  );
};
