"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SongWithRival } from "@/types/songs/score";
import type { RadarCategory } from "@/types/stats/radar";
import { ALL_RADAR_CATEGORIES, RADAR_COLORS } from "@/constants/radars";
import {
  useRivalAnalysis,
  type RivalDiffPoint,
  type RivalCategoryStat,
} from "@/hooks/social/useRivalAnalysis";
import { BpiScatterChart } from "@/components/partials/Metrics/ArenaAverage/BpiScatterChart";

// ---- 小コンポーネント ----

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
              id={`rival-cat-${cat}`}
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
              htmlFor={`rival-cat-${cat}`}
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

const DiffRankingList = ({
  title,
  items,
  isWin,
}: {
  title: string;
  items: RivalDiffPoint[];
  isWin: boolean;
}) => {
  const maxDiff = Math.max(...items.map((i) => i.diff), 1);
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-center text-xs text-bpim-muted">該当曲なし</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => {
            const pct = Math.min(100, (item.diff / maxDiff) * 100);
            const color = isWin ? "#4ade80" : "#ef4444";
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[11px] font-bold text-bpim-text">
                        {item.title}
                      </span>
                      <span className="text-[9px] text-bpim-muted">
                        {item.difficulty}
                        {item.radarCategory && (
                          <span
                            className="ml-1"
                            style={{ color: RADAR_COLORS[item.radarCategory] }}
                          >
                            {item.radarCategory}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end font-mono text-[10px]">
                      <span
                        className="font-black"
                        style={{ color }}
                      >
                        {isWin ? "+" : "-"}{item.diff.toFixed(1)}
                      </span>
                      <span className="text-bpim-muted">
                        {item.myBpi.toFixed(1)} / {item.rivalBpi.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bpim-surface-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CategoryBpiComparison = ({
  stats,
  rivalName,
}: {
  stats: RivalCategoryStat[];
  rivalName?: string;
}) => {
  const maxAbs = Math.max(
    ...stats.flatMap((s) =>
      [s.myTotal, s.rivalTotal]
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
      </p>
      <div className="flex flex-col gap-3">
        {stats.map(({ cat, myTotal, rivalTotal, songCount }) => {
          const color = RADAR_COLORS[cat];
          const diff =
            myTotal !== null && rivalTotal !== null ? myTotal - rivalTotal : null;
          const myPct =
            myTotal !== null
              ? Math.min(100, (Math.abs(myTotal) / maxAbs) * 100)
              : 0;
          const rivalPct =
            rivalTotal !== null
              ? Math.min(100, (Math.abs(rivalTotal) / maxAbs) * 100)
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
                    自分:{" "}
                    <span className="font-black text-bpim-primary">
                      {myTotal !== null ? myTotal.toFixed(2) : "-"}
                    </span>
                  </span>
                  <span className="text-bpim-muted">
                    {rivalName ?? "ライバル"}:{" "}
                    <span className="font-black text-bpim-warning">
                      {rivalTotal !== null ? rivalTotal.toFixed(2) : "-"}
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
                </div>
              </div>
              <div className="relative flex h-4 w-full flex-col gap-0.5 overflow-hidden rounded-sm bg-bpim-surface-2">
                <div
                  className="absolute top-0 h-2 rounded-t-sm transition-all"
                  style={{ width: `${myPct}%`, backgroundColor: color, opacity: 0.85 }}
                />
                <div
                  className="absolute bottom-0 h-2 rounded-b-sm transition-all"
                  style={{ width: `${rivalPct}%`, backgroundColor: color, opacity: 0.35 }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-bpim-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-85" />
          自分
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-35" />
          {rivalName ?? "ライバル"}
        </span>
      </div>
    </div>
  );
};

const LEVELS = [11, 12] as const;
const DIFFICULTIES = ["HYPER", "ANOTHER", "LEGGENDARIA"] as const;
type DifficultyName = (typeof DIFFICULTIES)[number];

const SongFilter = ({
  selectedLevels,
  selectedDifficulties,
  onLevelToggle,
  onDifficultyToggle,
}: {
  selectedLevels: Set<number>;
  selectedDifficulties: Set<DifficultyName>;
  onLevelToggle: (level: number) => void;
  onDifficultyToggle: (diff: DifficultyName) => void;
}) => (
  <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
          レベル
        </span>
        {LEVELS.map((level) => {
          const active = selectedLevels.has(level);
          return (
            <div key={level} className="flex items-center gap-1.5">
              <Checkbox
                id={`filter-level-${level}`}
                checked={active}
                onCheckedChange={() => onLevelToggle(level)}
                className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary data-[state=checked]:border-bpim-primary"
              />
              <Label
                htmlFor={`filter-level-${level}`}
                className="cursor-pointer text-xs font-bold text-bpim-text"
              >
                ☆{level}
              </Label>
            </div>
          );
        })}
      </div>
      <div className="h-4 w-px bg-bpim-border" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
          難易度
        </span>
        {DIFFICULTIES.map((diff) => {
          const active = selectedDifficulties.has(diff);
          return (
            <div key={diff} className="flex items-center gap-1.5">
              <Checkbox
                id={`filter-diff-${diff}`}
                checked={active}
                onCheckedChange={() => onDifficultyToggle(diff)}
                className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary data-[state=checked]:border-bpim-primary"
              />
              <Label
                htmlFor={`filter-diff-${diff}`}
                className="cursor-pointer text-xs font-bold text-bpim-text"
              >
                {diff}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ---- メインコンポーネント ----

interface RivalAnalysisProps {
  songs: SongWithRival[] | undefined;
  rivalName?: string;
}

export const RivalAnalysis = ({ songs, rivalName }: RivalAnalysisProps) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<RadarCategory>>(
    new Set(ALL_RADAR_CATEGORIES),
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    new Set(LEVELS),
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<DifficultyName>>(
    new Set(DIFFICULTIES),
  );

  const handleToggle = (cat: RadarCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleLevelToggle = (level: number) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const handleDifficultyToggle = (diff: DifficultyName) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      next.has(diff) ? next.delete(diff) : next.add(diff);
      return next;
    });
  };

  const filteredSongs = songs?.filter(
    (s) =>
      selectedLevels.has(s.difficultyLevel) &&
      selectedDifficulties.has(s.difficulty as DifficultyName),
  );

  const {
    scatterPoints,
    axisDomain,
    winCount,
    lossCount,
    avgBpiDiff,
    topWins,
    topLosses,
    categoryStats,
  } = useRivalAnalysis(filteredSongs, selectedCategories);

  const label = rivalName ?? "ライバル";

  return (
    <div className="flex flex-col gap-6 p-4">
      <SongFilter
        selectedLevels={selectedLevels}
        selectedDifficulties={selectedDifficulties}
        onLevelToggle={handleLevelToggle}
        onDifficultyToggle={handleDifficultyToggle}
      />
      <CategoryFilter
        selectedCategories={selectedCategories}
        onToggle={handleToggle}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="勝ち（BPI上回り）"
          value={songs ? String(winCount) : "-"}
          accent="text-green-400"
        />
        <StatCard
          label="負け（BPI下回り）"
          value={songs ? String(lossCount) : "-"}
          accent="text-red-400"
        />
        <StatCard
          label="平均BPI差"
          value={
            avgBpiDiff !== null
              ? `${avgBpiDiff >= 0 ? "+" : ""}${avgBpiDiff.toFixed(2)}`
              : "-"
          }
          accent={
            avgBpiDiff === null
              ? undefined
              : avgBpiDiff >= 0
              ? "text-green-400"
              : "text-red-400"
          }
        />
      </div>

      <BpiScatterChart
        rank={label}
        title={`${label}BPI vs 自分のBPI`}
        xLabel={`${label}のBPI`}
        scatterPoints={scatterPoints}
        axisDomain={axisDomain}
        rankColor="#f59e0b"
        selectedCategories={selectedCategories}
        user={{ userId: "rival-analysis" }}
        userLoading={songs === undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DiffRankingList
          title={`自分が上回っている上位 ${topWins.length} 曲`}
          items={topWins}
          isWin
        />
        <DiffRankingList
          title={`${label}に負けている上位 ${topLosses.length} 曲`}
          items={topLosses}
          isWin={false}
        />
      </div>

      <CategoryBpiComparison stats={categoryStats} rivalName={label} />
    </div>
  );
};
