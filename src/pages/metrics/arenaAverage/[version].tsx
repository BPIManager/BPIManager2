"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useArenaAverages } from "@/hooks/metrics/useArenaAverage";
import { ArenaAverageTable } from "@/components/partials/Metrics/ArenaAverage/ui";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import {
  ArenaAverageFilter,
  type DetailFilter,
} from "@/components/partials/Metrics/LevelSelector/ui";
import { ArenaAverageFilterSkeleton } from "@/components/partials/Metrics/LevelSelector/skeleton";
import { latestVersion } from "@/constants/latestVersion";
import { Skeleton } from "@/components/ui/skeleton";

const ALL_DIFFICULTIES = new Set(["HYPER", "ANOTHER", "LEGGENDARIA"]);

const DJRANK_THRESHOLDS = [
  { label: "F", ratio: 0 },
  { label: "E", ratio: 2 / 9 },
  { label: "D", ratio: 3 / 9 },
  { label: "C", ratio: 4 / 9 },
  { label: "B", ratio: 5 / 9 },
  { label: "A", ratio: 6 / 9 },
  { label: "AA", ratio: 7 / 9 },
  { label: "AAA", ratio: 8 / 9 },
  { label: "MAX-", ratio: 17 / 18 },
];

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

  const filteredAverages = useMemo(() => {
    return (averages as import("@/types/metrics/arena").ArenaAverageData[]).filter((item) => {
      if (!selectedDifficulties.has(item.difficulty)) return false;

      if (
        nameSearch &&
        !item.title.toLowerCase().includes(nameSearch.toLowerCase())
      )
        return false;

      for (const f of detailFilters) {
        if (!f.value) continue;
        const stats = item.averages[f.rank];
        if (!stats) return false;

        if (f.metric === "score") {
          const val = parseFloat(f.value);
          if (isNaN(val)) continue;
          if (f.operator === ">=" && stats.avgExScore < val) return false;
          if (f.operator === "<=" && stats.avgExScore > val) return false;
        } else if (f.metric === "scoreRate") {
          const val = parseFloat(f.value);
          if (isNaN(val)) continue;
          if (f.operator === ">=" && stats.rate < val) return false;
          if (f.operator === "<=" && stats.rate > val) return false;
        } else if (f.metric === "djrank") {
          const idx = DJRANK_THRESHOLDS.findIndex((t) => t.label === f.value);
          if (idx === -1) continue;
          const ratio = stats.rate / 100;
          if (f.operator === ">=") {
            if (ratio < DJRANK_THRESHOLDS[idx].ratio) return false;
          } else {
            const nextThreshold = DJRANK_THRESHOLDS[idx + 1];
            if (nextThreshold && ratio >= nextThreshold.ratio) return false;
          }
        }
      }

      return true;
    });
  }, [averages, selectedDifficulties, nameSearch, detailFilters]);

  const filterKey = `${[...selectedDifficulties].sort().join(",")}-${nameSearch}-${JSON.stringify(detailFilters)}`;

  const isInitialLoading = !router.isReady || isLoading;
  const showLoading = !router.isReady || isLoading || isNavigating;

  return (
    <DashboardLayout>
      <Meta
        title={`アリーナ平均 (Ver.${v} ☆${level})`}
        description="アリーナランク別平均スコアを確認できます"
        noIndex
      />

      <PageHeader
        title="アリーナランク別平均"
        description="アリーナランク別平均スコアを確認できます"
      />

      <PageContainer>
        <div className="flex flex-col gap-6">
          {isInitialLoading ? (
            <ArenaAverageFilterSkeleton />
          ) : (
            <ArenaAverageFilter
              version={v}
              onVersionChange={(newV: string) =>
                handleFilterChange(newV, level)
              }
              level={level}
              onLevelChange={(newL: string) => handleFilterChange(v, newL)}
              selectedDifficulties={selectedDifficulties}
              onDifficultiesChange={setSelectedDifficulties}
              nameSearch={nameSearch}
              onNameSearchChange={setNameSearch}
              detailFilters={detailFilters}
              onDetailFiltersChange={setDetailFilters}
            />
          )}

          {showLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-100 w-full rounded-xl" />
            </div>
          ) : (
            <div className="w-full animate-in fade-in duration-500">
              <ArenaAverageTable key={filterKey} data={filteredAverages} />
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
};

export default ArenaMetricsView;
