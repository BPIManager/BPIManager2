"use client";

import { useState } from "react";
import type { SongWithRival } from "@/types/songs/score";
import type { RadarCategory } from "@/types/stats/radar";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { useRivalAnalysis } from "@/hooks/social/useRivalAnalysis";
import BpiScatterChart from "@/components/partials/common/Charts/BpiScatterChart";
import StatCard from "@/components/partials/common/Metrics/StatCard";
import RadarCategoryFilter from "@/components/partials/common/Metrics/RadarCategoryFilter";
import { useTranslation } from "@/hooks/common/useTranslation";
import SongFilter, { type DifficultyName } from "./SongFilter";
import DiffRankingList from "./DiffRankingList";
import CategoryBpiComparison from "./CategoryBpiComparison";

const LEVELS = [11, 12] as const;
const DIFFICULTIES = IIDX_DIFFICULTIES;

interface RivalAnalysisProps {
  songs: SongWithRival[] | undefined;
  rivalName?: string;
}

const RivalAnalysis = ({ songs, rivalName }: RivalAnalysisProps) => {
  const { t, tFormat } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<
    Set<RadarCategory>
  >(new Set(ALL_RADAR_CATEGORIES));
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    new Set(LEVELS),
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Set<DifficultyName>
  >(new Set(DIFFICULTIES));

  const handleToggle = (cat: RadarCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleLevelToggle = (level: number) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const handleDifficultyToggle = (diff: DifficultyName) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(diff)) {
        next.delete(diff);
      } else {
        next.add(diff);
      }
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

  const label = rivalName ?? t("rivals.analysis.rival");

  return (
    <div className="flex flex-col gap-6 p-4">
      <SongFilter
        selectedLevels={selectedLevels}
        selectedDifficulties={selectedDifficulties}
        onLevelToggle={handleLevelToggle}
        onDifficultyToggle={handleDifficultyToggle}
      />
      <RadarCategoryFilter
        selectedCategories={selectedCategories}
        onToggle={handleToggle}
        idPrefix="rival-cat"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("rivals.analysis.winCount")}
          value={songs ? String(winCount) : "-"}
          accent="text-green-400"
        />
        <StatCard
          label={t("rivals.analysis.lossCount")}
          value={songs ? String(lossCount) : "-"}
          accent="text-red-400"
        />
        <StatCard
          label={t("rivals.analysis.avgBpiDiff")}
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
        title={tFormat("rivals.analysis.bpiVs", { rival: label })}
        xLabel={tFormat("rivals.analysis.rivalBpiLabel", { rival: label })}
        scatterPoints={scatterPoints}
        axisDomain={axisDomain}
        rankColor="#f59e0b"
        selectedCategories={selectedCategories}
        user={{ userId: "rival-analysis" }}
        userLoading={songs === undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DiffRankingList
          title={tFormat("rivals.analysis.topWins", { count: topWins.length })}
          items={topWins}
          isWin
        />
        <DiffRankingList
          title={tFormat("rivals.analysis.topLosses", {
            rival: label,
            count: topLosses.length,
          })}
          items={topLosses}
          isWin={false}
        />
      </div>

      <CategoryBpiComparison stats={categoryStats} rivalName={label} />
    </div>
  );
};

export default RivalAnalysis;
