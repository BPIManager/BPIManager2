"use client";

import type { ArenaAverageData } from "@/types/metrics/arena";
import type { RadarCategory } from "@/types/stats/radar";
import { useArenaAnalysis } from "@/hooks/metrics/useArenaAnalysis";
import BpiScatterChart from "@/components/partials/common/Charts/BpiScatterChart";
import StatCard from "@/components/partials/common/Metrics/StatCard";
import RadarCategoryFilter from "@/components/partials/common/Metrics/RadarCategoryFilter";
import { useTranslation } from "@/hooks/common/useTranslation";
import BpiRankingList from "./BpiRankingList";
import BpiHistogram from "./BpiHistogram";
import CategoryBpiComparison from "./CategoryBpiComparison";

interface ArenaAnalysisProps {
  data: ArenaAverageData[];
  rank: string;
  version: string;
  selectedCategories: Set<RadarCategory>;
  onCategoryToggle: (cat: RadarCategory) => void;
}

const ArenaAnalysis = ({
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
  const { t } = useTranslation();

  if (songsWithArenaBpi.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <RadarCategoryFilter
          selectedCategories={selectedCategories}
          onToggle={onCategoryToggle}
          idPrefix="radar-cat"
        />
        <div className="flex items-center justify-center py-20 text-sm text-bpim-muted">
          {t("arenaAnalysis.noData")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <RadarCategoryFilter
        selectedCategories={selectedCategories}
        onToggle={onCategoryToggle}
        idPrefix="radar-cat"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("arenaAnalysis.avgTotalBpi")}
          value={totalBpi !== null ? totalBpi.toFixed(2) : "-"}
          accent="text-bpim-primary"
        />
        <StatCard
          label={t("arenaAnalysis.avgSongBpi")}
          value={avgBpi !== null ? avgBpi.toFixed(2) : "-"}
        />
        <StatCard
          label={t("arenaAnalysis.avgScoreRate")}
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
          title={t("arenaAnalysis.topSongs")}
          songs={topSongs}
          maxAbsBpi={maxAbsBpi}
        />
        <BpiRankingList
          title={t("arenaAnalysis.bottomSongs")}
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

export default ArenaAnalysis;
