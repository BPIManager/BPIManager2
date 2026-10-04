"use client";

import { useBpiOptimizer } from "@/hooks/analytics/useBpiOptimizer";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { useRadar } from "@/hooks/stats/useRadar";
import { fetchImportOptimizeMemo, fetchBpiOptimizerDataset, type ImportedGoalTarget } from "@/services/swr/analytics";
import type { DatasetSource } from "./ui/DatasetPickerDrawer";
import { BpiCalculator } from "@/lib/bpi";
import type { OptimizeMemoResponse } from "@/hooks/analytics/useOptimizeMemo";

import { useUser } from "@/contexts/users/UserContext";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useTotalBpiStats } from "@/hooks/stats/useCurrentTotalBpi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { RadarCategory } from "@/types/stats/radar";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { toast } from "sonner";

import { useTranslation } from "@/hooks/common/useTranslation";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

type CreationMode = "select" | "auto" | "custom";

export function useBpiOptimizerSection() {
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
const [editingMemo, setEditingMemo] = useState<OptimizeMemoResponse | null>(null);
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

const handleEditMemo = async (memo: OptimizeMemoResponse) => {
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

  return {
    closeDrawer,
    considerCurrentTotalBpi,
    creationMode,
    currentBpis,
    currentScores,
    currentTotalBpi,
    customFooterState,
    datasetVersion,
    deleteMemo,
    editingLoadingId,
    editingMemo,
    fbUser,
    guardNavigation,
    handleApplyDataset,
    handleApplySingleBpiTarget,
    handleEditMemo,
    handleKeyDown,
    handleSave,
    handleSubmit,
    importedTargets,
    inputError,
    isDatasetApplying,
    isDatasetPickerOpen,
    isDeleting,
    isDrawerOpen,
    isImportModalOpen,
    isLoading,
    isSaving,
    isSingleBpiTargetApplying,
    isSingleBpiTargetOpen,
    liveCurrentTotalBpi,
    maxStepsInput,
    memos,
    pendingNavigation,
    radarElements,
    resetCustomCreationState,
    result,
    resultRef,
    savedResult,
    searchMode,
    setConsiderCurrentTotalBpi,
    setCreationMode,
    setCustomFooterState,
    setDatasetVersion,
    setImportedTargets,
    setIsCustomDirty,
    setIsDatasetPickerOpen,
    setIsDrawerOpen,
    setIsImportModalOpen,
    setIsSingleBpiTargetOpen,
    setMaxStepsInput,
    setPendingNavigation,
    setSearchMode,
    setTargetBpiInput,
    strategies,
    strongRadarCategories,
    t,
    targetBpiInput,
    toggleRadarElement,
    toggleStrategy,
    user,
    weakRadarCategories,
  };
}

export type BpiOptimizerSectionVM = ReturnType<typeof useBpiOptimizerSection>;
