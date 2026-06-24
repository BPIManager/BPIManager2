"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useArenaAverages } from "@/hooks/metrics/useArenaAverage";
import {
  ArenaAverageTable,
  type DisplayMetric,
} from "@/components/partials/Metrics/ArenaAverage/ui";
import { ArenaAnalysis } from "@/components/partials/Metrics/ArenaAverage/analysis";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import {
  ArenaAverageFilter,
  type DetailFilter,
} from "@/components/partials/Metrics/LevelSelector/ui";
import { ArenaAverageFilterSkeleton } from "@/components/partials/Metrics/LevelSelector/skeleton";
import { latestVersion } from "@/constants/iidx/latestVersion";
import { versionsNonDisabledCollection } from "@/constants/iidx/versions";
import { A_RANKS } from "@/constants/iidx/arenaRanks";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { RANK_TABLE } from "@/constants/iidx/djRank";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/diffs";

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

  const filteredAverages = useMemo(() => {
    return (
      averages as import("@/types/metrics/arena").ArenaAverageData[]
    ).filter((item) => {
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
          const idx = RANK_TABLE.findIndex((t) => t.label === f.value);
          if (idx === -1) continue;
          const ratio = stats.rate / 100;
          if (f.operator === ">=") {
            if (ratio < RANK_TABLE[idx].ratio) return false;
          } else {
            const nextThreshold = RANK_TABLE[idx + 1];
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
                    key={filterKey}
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

const AnalysisControls = ({
  version,
  onVersionChange,
  rank,
  onRankChange,
  level,
  onLevelChange,
}: {
  version: string;
  onVersionChange: (v: string) => void;
  rank: string;
  onRankChange: (r: string) => void;
  level: string;
  onLevelChange: (l: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4 shadow-sm backdrop-blur-md">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
            Version
          </span>
          <Select value={version} onValueChange={onVersionChange}>
            <SelectTrigger className="h-9 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
            {t("page.arenaAverage.rank")}
          </span>
          <Select value={rank} onValueChange={onRankChange}>
            <SelectTrigger className="h-9 border-bpim-border bg-bpim-surface-2/60 text-sm font-bold text-bpim-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {A_RANKS.map((r) => (
                <SelectItem key={r} value={r} className="text-sm font-bold">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
            Level
          </span>
          <RadioGroup
            value={level}
            onValueChange={onLevelChange}
            className="flex h-9 items-center gap-8"
          >
            {["11", "12"].map((lv) => (
              <div key={lv} className="flex items-center gap-2">
                <RadioGroupItem
                  value={lv}
                  id={`analysis-lv-${lv}`}
                  className="border-bpim-primary"
                />
                <Label
                  htmlFor={`analysis-lv-${lv}`}
                  className="cursor-pointer text-sm font-bold text-bpim-text"
                >
                  ☆{lv}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default ArenaMetricsView;
