"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useArenaAverages } from "@/hooks/metrics/useArenaAverage";
import {
  ArenaAverageTable,
  type DisplayMetric,
} from "@/components/partials/common/Charts/ArenaAverage/ui";
import { ArenaAnalysis } from "@/components/partials/common/Charts/ArenaAverage/analysis";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import {
  ArenaAverageFilter,
  type DetailFilter,
} from "@/components/partials/features/Metrics/LevelSelector/ui";
import { ArenaAverageFilterSkeleton } from "@/components/partials/features/Metrics/LevelSelector/skeleton";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { filterArenaAverages } from "@/components/partials/features/Metrics/ArenaAverage/filterAverages";
import { AnalysisControls } from "@/components/partials/features/Metrics/ArenaAverage/AnalysisControls";

const ALL_DIFFICULTIES = new Set(IIDX_DIFFICULTIES);
type RadarCat = (typeof ALL_RADAR_CATEGORIES)[number];
const ALL_CATEGORIES_SET = new Set<RadarCat>(ALL_RADAR_CATEGORIES);

export const ArenaMetricsView = ({
  version: initialVersion,
}: {
  version: string;
}) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [selectedDifficulties, setSelectedDifficulties] =
    useState<Set<string>>(ALL_DIFFICULTIES);
  const [nameSearch, setNameSearch] = useState("");
  const [detailFilters, setDetailFilters] = useState<DetailFilter[]>([]);
  const [displayMetric, setDisplayMetric] = useState<DisplayMetric>("exScore");
  const [analysisRank, setAnalysisRank] = useState<string>("A1");
  const [selectedCategories, setSelectedCategories] =
    useState<Set<RadarCat>>(ALL_CATEGORIES_SET);
  const { t } = useTranslation();

  const handleCategoryToggle = (cat: RadarCat) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const v = router.isReady
    ? (router.query.version as string) || initialVersion || latestVersion
    : initialVersion || latestVersion;
  const level = (router.query.difficultyLevel as string) || "12";

  const { averages, isLoading } = useArenaAverages(v, parseInt(level));

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) setIsNavigating(true);
    };
    const handleComplete = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router.asPath, router.events]);

  const handleFilterChange = (newVersion: string, newLevel: string) => {
    router.push(
      {
        pathname: `/metrics/arenaAverage/${newVersion}`,
        query: { difficultyLevel: newLevel },
      },
      undefined,
      { shallow: false },
    );
  };

  const filteredAverages = useMemo(
    () =>
      filterArenaAverages(
        averages as import("@/types/metrics/arena").ArenaAverageData[],
        { selectedDifficulties, nameSearch, detailFilters },
      ),
    [averages, selectedDifficulties, nameSearch, detailFilters],
  );

  const isInitialLoading = !router.isReady || isLoading;
  const showLoading = !router.isReady || isLoading || isNavigating;

  return (
    <DashboardLayout>
      <Meta
        title={`${t("page.arenaAverage.title")} (Ver.${v} ☆${level})`}
        description={t("page.arenaAverage.desc")}
        noIndex
      />

      <PageHeader
        title={t("page.arenaAverage.title")}
        description={t("page.arenaAverage.desc")}
      />

      <PageContainer>
        <Tabs defaultValue="list" className="flex flex-col gap-6">
          <TabsList className="w-full">
            <TabsTrigger value="list">
              {t("page.arenaAverage.list")}
            </TabsTrigger>
            <TabsTrigger value="analysis">
              {t("page.arenaAverage.analytics")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="flex flex-col gap-6">
              {isInitialLoading ? (
                <ArenaAverageFilterSkeleton />
              ) : (
                <ArenaAverageFilter
                  version={v}
                  onVersionChange={(newV) => handleFilterChange(newV, level)}
                  level={level}
                  onLevelChange={(newL) => handleFilterChange(v, newL)}
                  selectedDifficulties={selectedDifficulties}
                  onDifficultiesChange={setSelectedDifficulties}
                  nameSearch={nameSearch}
                  onNameSearchChange={setNameSearch}
                  detailFilters={detailFilters}
                  onDetailFiltersChange={setDetailFilters}
                  displayMetric={displayMetric}
                  onDisplayMetricChange={setDisplayMetric}
                />
              )}

              {showLoading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-100 w-full rounded-xl" />
                </div>
              ) : (
                <div className="w-full animate-in fade-in duration-500">
                  <ArenaAverageTable
                    data={filteredAverages}
                    displayMetric={displayMetric}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="flex flex-col gap-6">
              <AnalysisControls
                version={v}
                onVersionChange={(newV) => handleFilterChange(newV, level)}
                rank={analysisRank}
                onRankChange={setAnalysisRank}
                level={level}
                onLevelChange={(newL) => handleFilterChange(v, newL)}
              />
              {showLoading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-80 w-full rounded-xl" />
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <ArenaAnalysis
                    data={
                      averages as import("@/types/metrics/arena").ArenaAverageData[]
                    }
                    rank={analysisRank}
                    version={v}
                    selectedCategories={selectedCategories}
                    onCategoryToggle={handleCategoryToggle}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </DashboardLayout>
  );
};

export default ArenaMetricsView;
