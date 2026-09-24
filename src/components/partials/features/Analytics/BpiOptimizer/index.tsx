"use client";

import { useBpiOptimizer } from "@/hooks/analytics/useBpiOptimizer";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { useRadar } from "@/hooks/stats/useRadar";
import OptimizerForm from "./ui/OptimizerForm";
import OptimizationStepList from "./ui/OptimizationStepList";
import SavedMemoList from "./ui/SavedMemoList";
import CreationModeSelect from "./ui/CreationModeSelect";
import OptimizerIntro from "./ui/OptimizerIntro";
import ImportGoalModal from "./ui/ImportGoalModal";
import CustomGoalCreator from "./ui/CustomGoal";
import {
  fetchImportOptimizeMemo,
  fetchBpiOptimizerDataset,
  type ImportedGoalTarget,
} from "@/services/swr/analytics";
import DatasetPickerDrawer, {
  type DatasetSource,
} from "./ui/DatasetPickerDrawer";
import SingleBpiTargetDrawer from "./ui/SingleBpiTargetDrawer";
import { BpiCalculator } from "@/lib/bpi";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import BpiOptimizerSkeleton from "./skeleton";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/users/UserContext";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useTotalBpiStats } from "@/hooks/stats/useCurrentTotalBpi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { RadarCategory } from "@/types/stats/radar";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { toast } from "sonner";
import { ArrowLeft, CircleDashed, Plus, Save, X } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type CreationMode = "select" | "auto" | "custom";

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
    isLoading,
    inputError,
    considerCurrentTotalBpi,
    setConsiderCurrentTotalBpi,
    datasetVersion,
    setDatasetVersion,
  } = useBpiOptimizer();

  const { memos, saveMemo, deleteMemo, isSaving, isDeleting } =
    useBpiOptimizerMemos(user?.userId, fbUser);

  const { songs } = useUserScores(user?.userId);
  const currentScores = useMemo(() => {
    const map = new Map<number, number | null>();
    songs?.forEach((song) => {
      map.set(song.songId, song.exScore);
    });
    return map;
  }, [songs]);
  const currentBpis = useMemo(() => {
    const map = new Map<number, number | null>();
    songs?.forEach((song) => {
      map.set(song.songId, song.bpi ?? null);
    });
    return map;
  }, [songs]);

  const { stats: liveTotalBpiStats } = useTotalBpiStats(
    user?.userId,
    latestVersion,
  );
  const liveCurrentTotalBpi = liveTotalBpiStats?.totalBpi ?? null;

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<CreationMode>("select");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedTargets, setImportedTargets] = useState<
    ImportedGoalTarget[] | undefined
  >(undefined);
  const [isCustomDirty, setIsCustomDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);
  const [editingMemo, setEditingMemo] = useState<OptimizeMemo | null>(null);
  const [editingLoadingId, setEditingLoadingId] = useState<string | null>(
    null,
  );
  const [customFooterState, setCustomFooterState] = useState<{
    canSave: boolean;
    isSaving: boolean;
    onSave: () => void;
  } | null>(null);
  const [isDatasetApplying, setIsDatasetApplying] = useState(false);
  const [isDatasetPickerOpen, setIsDatasetPickerOpen] = useState(false);
  const [isSingleBpiTargetOpen, setIsSingleBpiTargetOpen] = useState(false);
  const [isSingleBpiTargetApplying, setIsSingleBpiTargetApplying] =
    useState(false);

  const resetCustomCreationState = () => {
    setImportedTargets(undefined);
    setEditingMemo(null);
  };

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setCreationMode("select");
    resetCustomCreationState();
  }, []);

  const handleEditMemo = async (memo: OptimizeMemo) => {
    if (!user?.userId || editingLoadingId) return;
    setEditingLoadingId(memo.reportId);
    try {
      const targets = await fetchImportOptimizeMemo(
        user.userId,
        fbUser,
        memo.reportId,
      );
      setImportedTargets(targets);
      setEditingMemo(memo);
      setCreationMode("custom");
      setIsDrawerOpen(true);
    } catch {
      toast.error(t("optimizer.memo.editFailed"));
    } finally {
      setEditingLoadingId(null);
    }
  };

  const handleApplyDataset = async (source: DatasetSource) => {
    if (!user?.userId || isDatasetApplying) return;
    setIsDatasetApplying(true);
    try {
      const rows = await fetchBpiOptimizerDataset(user.userId, fbUser, source);
      const targets: ImportedGoalTarget[] = rows
        .filter(
          (
            r,
          ): r is typeof r & {
            exScore: number;
            coef: number;
            mu: number;
            sigma: number;
            residualVar: number;
          } =>
            r.exScore != null &&
            r.coef != null &&
            r.mu != null &&
            r.sigma != null &&
            r.residualVar != null,
        )
        .map((r) => ({
          songId: r.songId,
          title: r.title,
          difficulty: r.difficulty,
          difficultyLevel: r.difficultyLevel,
          notes: r.notes,
          toExScore: r.exScore,
          wrScore: r.wrScore,
          kaidenAvg: r.kaidenAvg,
          coef: r.coef,
          mu: r.mu,
          sigma: r.sigma,
          residualVar: r.residualVar,
        }));

      if (targets.length === 0) {
        toast.info(t("optimizer.selfBestSet.empty"));
        return;
      }
      setImportedTargets(targets);
      setEditingMemo(null);
      setCreationMode("custom");
      setIsDrawerOpen(true);
    } catch {
      toast.error(t("optimizer.selfBestSet.failed"));
    } finally {
      setIsDatasetApplying(false);
    }
  };

  const handleApplySingleBpiTarget = async (targetBpi: number) => {
    if (!user?.userId || isSingleBpiTargetApplying) return;
    setIsSingleBpiTargetApplying(true);
    try {
      // BPI計算パラメータ入りの曲一覧が欲しいだけでexScoreは使わないためsourceは何でもよい
      const rows = await fetchBpiOptimizerDataset(
        user.userId,
        fbUser,
        "self-best",
      );
      const targets: ImportedGoalTarget[] = rows
        .map((r) => {
          const toExScore = BpiCalculator.calcFromBPI(targetBpi, r);
          if (toExScore == null) return null;
          return {
            songId: r.songId,
            title: r.title,
            difficulty: r.difficulty,
            difficultyLevel: r.difficultyLevel,
            notes: r.notes,
            toExScore,
            wrScore: r.wrScore,
            kaidenAvg: r.kaidenAvg,
            coef: r.coef,
            mu: r.mu,
            sigma: r.sigma,
            residualVar: r.residualVar,
          };
        })
        .filter((t): t is ImportedGoalTarget => t !== null);

      if (targets.length === 0) {
        toast.info(t("optimizer.selfBestSet.empty"));
        return;
      }
      setImportedTargets(targets);
      setEditingMemo(null);
      setCreationMode("custom");
      setIsDrawerOpen(true);
      setIsSingleBpiTargetOpen(false);
    } catch {
      toast.error(t("optimizer.selfBestSet.failed"));
    } finally {
      setIsSingleBpiTargetApplying(false);
    }
  };

  const currentTotalBpi = result?.currentTotalBpi ?? liveCurrentTotalBpi;

  // 作成中の内容を保存せずに離脱しようとした場合に確認を挟む
  // （Drawerを閉じる・「作成方法を選び直す」ボタンの両方が対象）。
  const autoHasUnsavedChanges =
    creationMode === "auto" && !!result && savedResult !== result;
  const customHasUnsavedChanges = creationMode === "custom" && isCustomDirty;
  const hasUnsavedCreation = autoHasUnsavedChanges || customHasUnsavedChanges;

  const guardNavigation = useCallback(
    (action: () => void) => {
      if (hasUnsavedCreation) {
        setPendingNavigation(() => action);
      } else {
        action();
      }
    },
    [hasUnsavedCreation],
  );

  const handleSave = useCallback(async () => {
    if (!result || !targetBpiInput) return;
    await saveMemo(parseFloat(targetBpiInput), result, "auto");
    setSavedResult(result);
    toast.success(t("optimizer.savedPlan"));
    closeDrawer();
  }, [result, targetBpiInput, saveMemo, t, closeDrawer]);

  const resultRef = useRef<HTMLDivElement>(null);
  const prevIsLoading = useRef(false);
  useEffect(() => {
    if (prevIsLoading.current && !isLoading && result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, result]);

  return (
    <div className="flex flex-col gap-6">
      {memos && (
        <SavedMemoList
          memos={memos}
          currentScores={currentScores}
          currentBpis={currentBpis}
          liveCurrentTotalBpi={liveCurrentTotalBpi}
          userId={user?.userId}
          fbUser={fbUser}
          onDelete={deleteMemo}
          isDeletingId={isDeleting}
          onEdit={handleEditMemo}
          isEditLoadingId={editingLoadingId}
          headerAction={
            <Button
              onClick={() => setIsDrawerOpen(true)}
              className="shrink-0 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t("optimizer.tabs.create")}
            </Button>
          }
        />
      )}

      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsDrawerOpen(true);
            return;
          }
          guardNavigation(closeDrawer);
        }}
        dismissible={false}
      >
        <DrawerContent>
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle>
              {editingMemo
                ? t("optimizer.customGoal.editTitle")
                : t("optimizer.tabs.create")}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => guardNavigation(closeDrawer)}
              aria-label={t("optimizer.customGoal.cancel")}
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerHeader>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-8">
            {creationMode === "select" && (
              <>
                <CreationModeSelect
                  onSelect={setCreationMode}
                  onImportClick={() => setIsImportModalOpen(true)}
                  onSelfBestSetClick={() => setIsDatasetPickerOpen(true)}
                  isSelfBestSetLoading={isDatasetApplying}
                  onSingleBpiTargetClick={() => setIsSingleBpiTargetOpen(true)}
                />
                <OptimizerIntro />
              </>
            )}

            {creationMode === "auto" && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => guardNavigation(() => setCreationMode("select"))}
                  className="flex items-center gap-1 self-start text-xs text-bpim-muted hover:text-bpim-text"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("optimizer.customGoal.backToSelect")}
                </button>

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
                  radarElements={{
                    value: radarElements,
                    onToggle: toggleRadarElement,
                  }}
                  strongRadarCategories={strongRadarCategories}
                  weakRadarCategories={weakRadarCategories}
                  currentTotalBpi={currentTotalBpi}
                  considerCurrentTotalBpi={considerCurrentTotalBpi}
                  onConsiderCurrentTotalBpiChange={setConsiderCurrentTotalBpi}
                  datasetVersion={datasetVersion}
                  onDatasetVersionChange={setDatasetVersion}
                />

                <div ref={resultRef}>
                  {isLoading && <BpiOptimizerSkeleton />}

                  {!isLoading && result && (
                    <OptimizationStepList result={result} />
                  )}
                </div>
              </div>
            )}

            {creationMode === "custom" && (
              <CustomGoalCreator
                currentScores={currentScores}
                initialTargets={importedTargets}
                editingMemo={editingMemo}
                onDirtyChange={setIsCustomDirty}
                onBack={() =>
                  guardNavigation(() => {
                    setCreationMode("select");
                    resetCustomCreationState();
                  })
                }
                onSaved={closeDrawer}
                onFooterStateChange={setCustomFooterState}
              />
            )}
          </div>

          {creationMode === "auto" && result && (
            <DrawerFooter className="border-t border-bpim-border pt-4">
              <Button
                onClick={handleSave}
                disabled={
                  !result.achievable ||
                  result.alreadyAchieved ||
                  isSaving ||
                  savedResult === result
                }
                className="w-full gap-2"
              >
                {isSaving ? (
                  <CircleDashed className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("optimizer.customGoal.save")}
              </Button>
              <p className="text-center text-[11px] text-bpim-subtle">
                {t("optimizer.customGoal.saveHint")}
              </p>
            </DrawerFooter>
          )}

          {creationMode === "custom" && customFooterState && (
            <DrawerFooter className="border-t border-bpim-border pt-4">
              <Button
                onClick={customFooterState.onSave}
                disabled={
                  !customFooterState.canSave || customFooterState.isSaving
                }
                className="w-full gap-2"
              >
                {customFooterState.isSaving && (
                  <CircleDashed className="h-4 w-4 animate-spin" />
                )}
                {editingMemo
                  ? t("optimizer.customGoal.updateAndClose")
                  : t("optimizer.customGoal.save")}
              </Button>
              {!editingMemo && (
                <p className="text-center text-[11px] text-bpim-subtle">
                  {t("optimizer.customGoal.saveHint")}
                </p>
              )}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      <DatasetPickerDrawer
        open={isDatasetPickerOpen}
        onOpenChange={setIsDatasetPickerOpen}
        onPick={handleApplyDataset}
      />

      <SingleBpiTargetDrawer
        open={isSingleBpiTargetOpen}
        onOpenChange={setIsSingleBpiTargetOpen}
        onSubmit={handleApplySingleBpiTarget}
        isLoading={isSingleBpiTargetApplying}
      />

      <ImportGoalModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userId={user?.userId}
        fbUser={fbUser}
        onImported={(targets) => {
          setImportedTargets(targets);
          setIsImportModalOpen(false);
          setCreationMode("custom");
          setIsDrawerOpen(true);
        }}
      />

      <ActionConfirmDialog
        isOpen={pendingNavigation !== null}
        onClose={() => setPendingNavigation(null)}
        onConfirm={() => {
          pendingNavigation?.();
          setPendingNavigation(null);
        }}
        title={t("optimizer.unsavedChanges.title")}
        description={t("optimizer.unsavedChanges.desc")}
        confirmLabel={t("optimizer.unsavedChanges.confirm")}
        isDestructive
      />
    </div>
  );
};

export default BpiOptimizerSection;
