"use client";

import SavedMemoList from "./ui/SavedMemoList";
import ImportGoalModal from "./ui/ImportGoalModal";

import DatasetPickerDrawer from "./ui/DatasetPickerDrawer";
import SingleBpiTargetDrawer from "./ui/SingleBpiTargetDrawer";

import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";

import { useBpiOptimizerSection } from "./useBpiOptimizerSection";
import { OptimizerCreateDrawer } from "./OptimizerCreateDrawer";

const BpiOptimizerSection = () => {
  const { closeDrawer, considerCurrentTotalBpi, creationMode, currentBpis, currentScores, currentTotalBpi, customFooterState, datasetVersion, deleteMemo, editingLoadingId, editingMemo, fbUser, guardNavigation, handleApplyDataset, handleApplySingleBpiTarget, handleEditMemo, handleKeyDown, handleSave, handleSubmit, importedTargets, inputError, isDatasetApplying, isDatasetPickerOpen, isDeleting, isDrawerOpen, isImportModalOpen, isLoading, isSaving, isSingleBpiTargetApplying, isSingleBpiTargetOpen, liveCurrentTotalBpi, maxStepsInput, memos, pendingNavigation, radarElements, resetCustomCreationState, result, resultRef, savedResult, searchMode, setConsiderCurrentTotalBpi, setCreationMode, setCustomFooterState, setDatasetVersion, setImportedTargets, setIsCustomDirty, setIsDatasetPickerOpen, setIsDrawerOpen, setIsImportModalOpen, setIsSingleBpiTargetOpen, setMaxStepsInput, setPendingNavigation, setSearchMode, setTargetBpiInput, strategies, strongRadarCategories, t, targetBpiInput, toggleRadarElement, toggleStrategy, user, weakRadarCategories } = useBpiOptimizerSection();
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

      <OptimizerCreateDrawer
        state={{ considerCurrentTotalBpi, creationMode, currentScores, currentTotalBpi, customFooterState, datasetVersion, editingMemo, importedTargets, inputError, isDatasetApplying, isDrawerOpen, isLoading, isSaving, maxStepsInput, radarElements, result, resultRef, savedResult, searchMode, strategies, strongRadarCategories, t, targetBpiInput, weakRadarCategories }}
        actions={{ closeDrawer, guardNavigation, handleKeyDown, handleSave, handleSubmit, resetCustomCreationState, setConsiderCurrentTotalBpi, setCreationMode, setCustomFooterState, setDatasetVersion, setIsCustomDirty, setIsDatasetPickerOpen, setIsDrawerOpen, setIsImportModalOpen, setIsSingleBpiTargetOpen, setMaxStepsInput, setSearchMode, setTargetBpiInput, toggleRadarElement, toggleStrategy }}
      />
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
