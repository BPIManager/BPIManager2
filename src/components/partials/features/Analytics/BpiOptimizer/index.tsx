"use client";

import { useBpiOptimizer } from "@/hooks/analytics/useBpiOptimizer";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { useRadar } from "@/hooks/stats/useRadar";
import OptimizerForm from "./ui/OptimizerForm";
import OptimizationStepList from "./ui/OptimizationStepList";
import SavedMemoList from "./ui/SavedMemoList";
import BpiOptimizerSkeleton from "./skeleton";
import { useUser } from "@/contexts/users/UserContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { RadarCategory } from "@/types/stats/radar";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/common/useTranslation";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const BpiOptimizerSection = () => {
  const { t } = useTranslation();
  const { user, fbUser } = useUser();
  const {
    targetBpiInput,
    setTargetBpiInput,
    maxStepsInput,
    setMaxStepsInput,
    searchMode,
    setSearchMode,
    strategies,
    radarElements,
    handleSubmit,
    handleKeyDown,
    toggleStrategy,
    toggleRadarElement,
    result,
    setResult,
    isLoading,
    inputError,
    considerCurrentTotalBpi,
    setConsiderCurrentTotalBpi,
  } = useBpiOptimizer();

  const { memos, saveMemo, deleteMemo, isSaving, isDeleting } =
    useBpiOptimizerMemos(user?.userId, fbUser);

  const { radar } = useRadar(
    fbUser?.uid,
    ["11", "12"],
    IIDX_DIFFICULTIES,
    latestVersion,
  );

  const strongRadarCategories = useMemo<RadarCategory[]>(() => {
    if (!radar) return [];
    const entries = (
      Object.entries(radar) as [RadarCategory, { totalBpi: number }][]
    ).sort((a, b) => b[1].totalBpi - a[1].totalBpi);
    return entries.slice(0, 2).map(([cat]) => cat);
  }, [radar]);

  const weakRadarCategories = useMemo<RadarCategory[]>(() => {
    if (!radar) return [];
    const entries = (
      Object.entries(radar) as [RadarCategory, { totalBpi: number }][]
    ).sort((a, b) => a[1].totalBpi - b[1].totalBpi);
    return entries.slice(0, 2).map(([cat]) => cat);
  }, [radar]);

  const [savedResult, setSavedResult] = useState<OptimizationResult | null>(
    null,
  );
  const [tab, setTab] = useState<"create" | "manage">("create");

  const currentTotalBpi =
    result?.currentTotalBpi ??
    (user?.totalBpi !== undefined ? Number(user.totalBpi) : null);

  const handleSave = useCallback(async () => {
    if (!result || !targetBpiInput) return;
    await saveMemo(parseFloat(targetBpiInput), result);
    setSavedResult(result);
    toast.success(t("optimizer.savedPlan"));
    setTab("manage");
  }, [result, targetBpiInput, saveMemo, t]);

  const resultRef = useRef<HTMLDivElement>(null);
  const prevIsLoading = useRef(false);
  useEffect(() => {
    if (prevIsLoading.current && !isLoading && result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, result]);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as "create" | "manage")}
      className="flex flex-col gap-6"
    >
      <TabsList className="w-full">
        <TabsTrigger value="create">{t("optimizer.tabs.create")}</TabsTrigger>
        <TabsTrigger value="manage">{t("optimizer.tabs.manage")}</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <div className="flex flex-col gap-4">
          <OptimizerForm
            targetBpiInput={targetBpiInput}
            onTargetBpiChange={setTargetBpiInput}
            maxStepsInput={maxStepsInput}
            onMaxStepsChange={setMaxStepsInput}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
            onKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
            inputError={inputError}
            isLoading={isLoading}
            strategies={{ value: strategies, onToggle: toggleStrategy }}
            radarElements={{ value: radarElements, onToggle: toggleRadarElement }}
            strongRadarCategories={strongRadarCategories}
            weakRadarCategories={weakRadarCategories}
            currentTotalBpi={currentTotalBpi}
            considerCurrentTotalBpi={considerCurrentTotalBpi}
            onConsiderCurrentTotalBpiChange={setConsiderCurrentTotalBpi}
          />

          <div ref={resultRef}>
            {isLoading && <BpiOptimizerSkeleton />}

            {!isLoading && result && (
              <OptimizationStepList
                result={result}
                onSave={handleSave}
                isSaving={isSaving}
                isSaved={savedResult === result}
              />
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="manage">
        {memos && (
          <SavedMemoList
            memos={memos}
            onDelete={deleteMemo}
            isDeletingId={isDeleting}
            onSelect={(historyResult) => {
              setResult(historyResult);
              setSavedResult(historyResult);
              setTargetBpiInput(historyResult.targetTotalBpi.toString());
              setTab("create");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default BpiOptimizerSection;
