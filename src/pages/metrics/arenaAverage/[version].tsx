"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useArenaAverages } from "@/hooks/metrics/useArenaAverage";
import { ArenaAverageTable } from "@/components/partials/Metrics/ArenaAverage/ui";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { ArenaAverageFilter } from "@/components/partials/Metrics/LevelSelector/ui";
import { ArenaAverageFilterSkeleton } from "@/components/partials/Metrics/LevelSelector/skeleton";
import { latestVersion } from "@/constants/latestVersion";
import { Skeleton } from "@/components/ui/skeleton";

export const ArenaMetricsView = ({
  version: initialVersion,
}: {
  version: string;
}) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

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
            />
          )}

          {showLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="w-full animate-in fade-in duration-500">
              <ArenaAverageTable data={averages} />
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
};

export default ArenaMetricsView;
