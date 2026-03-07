import { useRouter } from "next/router";
import { Stack, Skeleton } from "@chakra-ui/react";
import { useArenaAverages } from "@/hooks/metrics/useArenaAverage";
import { ArenaAverageTable } from "@/components/partials/Metrics/ArenaAverage/ui";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { ArenaAverageFilter } from "@/components/partials/Metrics/LevelSelector/ui";
import { latestVersion } from "@/constants/latestVersion";
import { useEffect, useState } from "react";
import { ArenaAverageFilterSkeleton } from "@/components/partials/Metrics/LevelSelector/skeleton";

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
      <PageHeader
        title="アリーナランク別平均"
        description={`アリーナランク別平均スコアを確認できます`}
      />
      <Meta
        title={`アリーナ平均 (Ver.${v} ☆${level})`}
        description={`アリーナランク別平均スコアを確認できます`}
      />

      <PageContainer>
        <Stack gap="6">
          {isInitialLoading ? (
            <ArenaAverageFilterSkeleton />
          ) : (
            <ArenaAverageFilter
              version={v}
              onVersionChange={(newV) => handleFilterChange(newV, level)}
              level={level}
              onLevelChange={(newL) => handleFilterChange(v, newL)}
            />
          )}

          {showLoading ? (
            <Stack>
              <Skeleton height="40px" width="full" />
              <Skeleton height="300px" width="full" />
            </Stack>
          ) : (
            <ArenaAverageTable data={averages} />
          )}
        </Stack>
      </PageContainer>
    </DashboardLayout>
  );
};

export default ArenaMetricsView;
