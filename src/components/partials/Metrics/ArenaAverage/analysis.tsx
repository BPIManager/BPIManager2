"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ArenaAverageData } from "@/types/metrics/arena";
import type { RadarCategory } from "@/types/stats/radar";
import {
  useArenaAnalysis,
  getBpiBarColor,
  type ArenaSongPoint,
} from "@/hooks/metrics/useArenaAnalysis";
import { ALL_RADAR_CATEGORIES, RADAR_COLORS } from "@/constants/radars";
import { BpiScatterChart } from "./BpiScatterChart";

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="flex flex-col gap-1 rounded-xl border border-bpim-border bg-bpim-surface-2/60 px-5 py-4">
    <span className="text-[10px] font-black uppercase tracking-widest text-bpim-muted">
      {label}
    </span>
    <span
      className={cn(
        "font-mono text-2xl font-black leading-none",
        accent ?? "text-bpim-text",
      )}
    >
      {value}
    </span>
  </div>
);

const CategoryFilter = ({
  selectedCategories,
  onToggle,
}: {
  selectedCategories: Set<RadarCategory>;
  onToggle: (cat: RadarCategory) => void;
}) => (
  <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        レーダー項目
      </span>
      {ALL_RADAR_CATEGORIES.map((cat) => {
        const active = selectedCategories.has(cat);
        return (
          <div key={cat} className="flex items-center gap-1.5">
            <Checkbox
              id={`radar-cat-${cat}`}
              checked={active}
              onCheckedChange={() => onToggle(cat)}
              className="h-4 w-4 border-bpim-border"
              style={
                active
                  ? {
                      backgroundColor: RADAR_COLORS[cat],
                      borderColor: RADAR_COLORS[cat],
                    }
                  : {}
              }
            />
            <Label
              htmlFor={`radar-cat-${cat}`}
              className="cursor-pointer whitespace-nowrap text-xs font-bold text-bpim-text"
              style={{ color: active ? RADAR_COLORS[cat] : undefined }}
            >
              {cat}
            </Label>
          </div>
        );
      })}
    </div>
  </div>
);

const BpiRankingList = ({
  title,
  songs,
  maxAbsBpi,
  reverse = false,
}: {
  title: string;
  songs: ArenaSongPoint[];
  maxAbsBpi: number;
  reverse?: boolean;
}) => (
  <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
    <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
      {title}
    </h3>
    <div className="flex flex-col gap-1.5">
      {songs.map((song, i) => {
        const pct = Math.min(100, (Math.abs(song.bpi) / maxAbsBpi) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            {!reverse && (
              <span className="w-4 shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                {i + 1}
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold text-bpim-text">
                  {song.title}
                </span>
                <span
                  className="shrink-0 font-mono text-[11px] font-black"
                  style={{
                    color: reverse ? "#64748b" : getBpiBarColor(song.bpi),
                  }}
                >
                  {song.bpi.toFixed(1)}
                </span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bpim-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    reverse && "ml-auto bg-slate-500",
                  )}
                  style={{
                    width: `${pct}%`,
                    ...(reverse
                      ? {}
                      : { backgroundColor: getBpiBarColor(song.bpi) }),
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const BpiHistogram = ({
  songs,
  rankColor,
}: {
  songs: ArenaSongPoint[];
  rankColor: string;
}) => {
  const buckets = useMemo(() => {
    const STEP = 10;
    const MIN = -20;
    const MAX = 110;
    const bins: { label: string; count: number }[] = [];
    for (let lo = MIN; lo < MAX; lo += STEP) {
      const hi = lo + STEP;
      const label = lo === MIN ? `<${hi}` : hi >= MAX ? `${lo}+` : `${lo}`;
      const count = songs.filter(
        (s) =>
          (lo === MIN ? s.bpi < hi : s.bpi >= lo) &&
          (hi >= MAX ? true : s.bpi < hi),
      ).length;
      bins.push({ label, count });
    }
    return bins;
  }, [songs]);

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        BPI 分布
      </h3>
      <div className="flex h-32 items-end gap-1">
        {buckets.map((b) => (
          <div
            key={b.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-[9px] font-bold text-bpim-muted">
              {b.count > 0 ? b.count : ""}
            </span>
            <div
              className="flex w-full flex-col justify-end"
              style={{ height: "80px" }}
            >
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${(b.count / maxCount) * 100}%`,
                  backgroundColor: rankColor,
                  opacity: b.count > 0 ? 0.8 : 0.1,
                  minHeight: b.count > 0 ? "2px" : "0",
                }}
              />
            </div>
            <span className="whitespace-nowrap text-[8px] text-bpim-muted">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

type CategoryBpiStat = {
  cat: RadarCategory;
  arenaTotal: number | null;
  userTotal: number | null;
  songCount: number;
};

const CategoryBpiComparison = ({
  stats,
  rank,
  user,
  userLoading,
}: {
  stats: CategoryBpiStat[];
  rank: string;
  user: { userId: string } | null | undefined;
  userLoading: boolean;
}) => {
  const maxAbs = Math.max(
    ...stats.flatMap((s) =>
      [s.arenaTotal, s.userTotal]
        .filter((v): v is number => v !== null)
        .map(Math.abs),
    ),
    1,
  );

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
      <h3 className="mb-1 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        カテゴリ別 総合BPI比較
      </h3>
      <p className="mb-4 text-[10px] text-bpim-muted">
        各レーダー項目の楽曲群で計算した総合BPI
        {!user && "（ログインすると自分のBPIが表示されます）"}
        {user && userLoading && "（読み込み中...）"}
      </p>
      <div className="flex flex-col gap-3">
        {stats.map(({ cat, arenaTotal, userTotal, songCount }) => {
          const color = RADAR_COLORS[cat];
          const diff =
            arenaTotal !== null && userTotal !== null
              ? userTotal - arenaTotal
              : null;
          const arenaPct =
            arenaTotal !== null
              ? Math.min(100, (Math.abs(arenaTotal) / maxAbs) * 100)
              : 0;
          const userPct =
            userTotal !== null
              ? Math.min(100, (Math.abs(userTotal) / maxAbs) * 100)
              : 0;

          return (
            <div key={cat} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold" style={{ color }}>
                    {cat}
                  </span>
                  <span className="text-[10px] text-bpim-muted">
                    ({songCount}曲)
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-bpim-muted">
                    {rank}:{" "}
                    <span className="font-black text-bpim-text">
                      {arenaTotal !== null ? arenaTotal.toFixed(2) : "-"}
                    </span>
                  </span>
                  {user && !userLoading && (
                    <>
                      <span className="text-bpim-muted">
                        自分:{" "}
                        <span className="font-black text-bpim-primary">
                          {userTotal !== null ? userTotal.toFixed(2) : "-"}
                        </span>
                      </span>
                      {diff !== null && (
                        <span
                          className={cn(
                            "font-black",
                            diff >= 0 ? "text-green-400" : "text-red-400",
                          )}
                        >
                          {diff >= 0 ? "+" : ""}
                          {diff.toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="relative flex h-4 w-full overflow-hidden rounded-sm bg-bpim-surface-2">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${arenaPct}%`,
                    backgroundColor: color,
                    opacity: 0.35,
                  }}
                />
                {user && !userLoading && userTotal !== null && (
                  <div
                    className="absolute top-0 h-full rounded-sm transition-all"
                    style={{
                      width: `${userPct}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-bpim-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-35" />
          {rank}平均
        </span>
        {user && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-85" />
            自分
          </span>
        )}
      </div>
    </div>
  );
};

// ---- メインコンポーネント ----

interface ArenaAnalysisProps {
  data: ArenaAverageData[];
  rank: string;
  version: string;
  selectedCategories: Set<RadarCategory>;
  onCategoryToggle: (cat: RadarCategory) => void;
}

export const ArenaAnalysis = ({
  data,
  rank,
  version,
  selectedCategories,
  onCategoryToggle,
}: ArenaAnalysisProps) => {
  const {
    user,
    userLoading,
    rankColor,
    songsWithArenaBpi,
    scatterPoints,
    totalBpi,
    avgRate,
    avgBpi,
    topSongs,
    bottomSongs,
    maxAbsBpi,
    scatterAxisDomain,
    categoryBpiStats,
  } = useArenaAnalysis(data, rank, version, selectedCategories);

  if (songsWithArenaBpi.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <CategoryFilter
          selectedCategories={selectedCategories}
          onToggle={onCategoryToggle}
        />
        <div className="flex items-center justify-center py-20 text-sm text-bpim-muted">
          このランク・カテゴリのBPIデータがありません
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CategoryFilter
        selectedCategories={selectedCategories}
        onToggle={onCategoryToggle}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="平均総合BPI"
          value={totalBpi !== null ? totalBpi.toFixed(2) : "-"}
          accent="text-bpim-primary"
        />
        <StatCard
          label="単曲平均BPI"
          value={avgBpi !== null ? avgBpi.toFixed(2) : "-"}
        />
        <StatCard
          label="平均スコアレート"
          value={avgRate !== null ? `${avgRate.toFixed(1)}%` : "-"}
        />
      </div>

      <BpiScatterChart
        rank={rank}
        scatterPoints={scatterPoints}
        axisDomain={scatterAxisDomain}
        rankColor={rankColor}
        selectedCategories={selectedCategories}
        user={user}
        userLoading={userLoading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BpiRankingList
          title="BPI 上位 15 曲"
          songs={topSongs}
          maxAbsBpi={maxAbsBpi}
        />
        <BpiRankingList
          title="BPI 下位 10 曲"
          songs={bottomSongs}
          maxAbsBpi={maxAbsBpi}
          reverse
        />
      </div>

      <BpiHistogram songs={songsWithArenaBpi} rankColor={rankColor} />

      <CategoryBpiComparison
        stats={categoryBpiStats}
        rank={rank}
        user={user}
        userLoading={userLoading}
      />
    </div>
  );
};
