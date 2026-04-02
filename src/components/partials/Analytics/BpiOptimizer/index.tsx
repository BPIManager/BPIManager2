"use client";

import { useBpiOptimizer } from "@/hooks/analytics/useBpiOptimizer";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { OptimizerForm, OptimizationStepList, SavedMemoList } from "./ui";
import { BpiOptimizerSkeleton } from "./skeleton";
import { useUser } from "@/contexts/users/UserContext";
import { useCallback, useState } from "react";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export const BpiOptimizerSection = () => {
  const { user } = useUser();
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
    handleSubmit,
    handleKeyDown,
    toggleStrategy,
    toggleLevel,
    toggleDifficulty,
    result,
    setResult,
    isLoading,
    inputError,
    considerCurrentTotalBpi,
    setConsiderCurrentTotalBpi,
  } = useBpiOptimizer();

  const { memos, saveMemo, deleteMemo, isSaving, isDeleting } =
    useBpiOptimizerMemos(user?.userId);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>
          この機能はベータ版です。算出ロジックは今後見直される可能性があり、必ずしも適切なルートが探索されない場合があります。フィードバックは
          <a
            href="https://forms.gle/VfMJpFrKfSJqRYLA8"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            こちら
          </a>
          からお願いします。
        </span>
      </div>

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
        currentTotalBpi={currentTotalBpi}
        considerCurrentTotalBpi={considerCurrentTotalBpi}
        onConsiderCurrentTotalBpiChange={setConsiderCurrentTotalBpi}
      />

      {isLoading && <BpiOptimizerSkeleton />}

      {!isLoading && result && (
        <OptimizationStepList
          result={result}
          onSave={handleSave}
          isSaving={isSaving}
          isSaved={savedResult === result}
        />
      )}

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
