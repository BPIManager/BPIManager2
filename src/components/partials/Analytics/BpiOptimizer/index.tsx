"use client";

import { useBpiOptimizer } from "@/hooks/analytics/useBpiOptimizer";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { useRadar } from "@/hooks/stats/useRadar";
import { OptimizerForm, OptimizationStepList, SavedMemoList } from "./ui";
import { BpiOptimizerSkeleton } from "./skeleton";
import { useUser } from "@/contexts/users/UserContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { RadarCategory } from "@/types/stats/radar";
import { latestVersion } from "@/constants/latestVersion";
import { toast } from "sonner";

export const BpiOptimizerSection = () => {
  const { user, fbUser } = useUser();
  const {
    targetBpiInput,
    setTargetBpiInput,
    maxStepsInput,
    setMaxStepsInput,
    searchMode,
    setSearchMode,
    strategies,
    levels,
    difficulties,
    radarElements,
    handleSubmit,
    handleKeyDown,
    toggleStrategy,
    toggleLevel,
    toggleDifficulty,
    toggleRadarElement,
    result,
    setResult,
    isLoading,
    inputError,
    considerCurrentTotalBpi,
    setConsiderCurrentTotalBpi,
  } = useBpiOptimizer();

  const { memos, saveMemo, deleteMemo, isSaving, isDeleting } =
    useBpiOptimizerMemos(user?.userId);

  const { radar } = useRadar(
    fbUser?.uid,
    ["11", "12"],
    ["HYPER", "ANOTHER", "LEGGENDARIA"],
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

  const currentTotalBpi =
    result?.currentTotalBpi ??
    (user?.totalBpi !== undefined ? Number(user.totalBpi) : null);

  const handleSave = useCallback(async () => {
    if (!result || !targetBpiInput) return;
    await saveMemo(parseFloat(targetBpiInput), result);
    setSavedResult(result);
    toast.success("プランを保存しました");
  }, [result, targetBpiInput, saveMemo]);

  const resultRef = useRef<HTMLDivElement>(null);
  const prevIsLoading = useRef(false);
  useEffect(() => {
    if (prevIsLoading.current && !isLoading && result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, result]);

  return (
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
        strategies={strategies}
        onToggleStrategy={toggleStrategy}
        levels={levels}
        onToggleLevel={toggleLevel}
        difficulties={difficulties}
        onToggleDifficulty={toggleDifficulty}
        radarElements={radarElements}
        onToggleRadarElement={toggleRadarElement}
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

      {!isLoading && memos && (
        <SavedMemoList
          memos={memos}
          onDelete={deleteMemo}
          isDeletingId={isDeleting}
          onSelect={(historyResult) => {
            setResult(historyResult);
            setSavedResult(historyResult);
            setTargetBpiInput(historyResult.targetTotalBpi.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
};
