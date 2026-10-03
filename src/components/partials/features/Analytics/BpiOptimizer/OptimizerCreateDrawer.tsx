"use client";

import OptimizerForm from "./ui/OptimizerForm";
import OptimizationStepList from "./ui/OptimizationStepList";
import CreationModeSelect from "./ui/CreationModeSelect";
import OptimizerIntro from "./ui/OptimizerIntro";
import CustomGoalCreator from "./ui/CustomGoal";


import BpiOptimizerSkeleton from "./skeleton";
import { Button } from "@/components/ui/button";

import { ArrowLeft, CircleDashed, Save, X } from "lucide-react";

import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

import type { BpiOptimizerSectionVM } from "./useBpiOptimizerSection";

export interface OptimizerCreateDrawerProps {
  state: Pick<BpiOptimizerSectionVM, "considerCurrentTotalBpi" | "creationMode" | "currentScores" | "currentTotalBpi" | "customFooterState" | "datasetVersion" | "editingMemo" | "importedTargets" | "inputError" | "isDatasetApplying" | "isDrawerOpen" | "isLoading" | "isSaving" | "maxStepsInput" | "radarElements" | "result" | "resultRef" | "savedResult" | "searchMode" | "strategies" | "strongRadarCategories" | "t" | "targetBpiInput" | "weakRadarCategories">;
  actions: Pick<BpiOptimizerSectionVM, "closeDrawer" | "guardNavigation" | "handleKeyDown" | "handleSave" | "handleSubmit" | "resetCustomCreationState" | "setConsiderCurrentTotalBpi" | "setCreationMode" | "setCustomFooterState" | "setDatasetVersion" | "setIsCustomDirty" | "setIsDatasetPickerOpen" | "setIsDrawerOpen" | "setIsImportModalOpen" | "setIsSingleBpiTargetOpen" | "setMaxStepsInput" | "setSearchMode" | "setTargetBpiInput" | "toggleRadarElement" | "toggleStrategy">;
}

/** 目標作成のドロワー（作成モード選択・自動/カスタム作成・データセット適用）。 */
export const OptimizerCreateDrawer = ({ state, actions }: OptimizerCreateDrawerProps) => {
  const { considerCurrentTotalBpi, creationMode, currentScores, currentTotalBpi, customFooterState, datasetVersion, editingMemo, importedTargets, inputError, isDatasetApplying, isDrawerOpen, isLoading, isSaving, maxStepsInput, radarElements, result, resultRef, savedResult, searchMode, strategies, strongRadarCategories, t, targetBpiInput, weakRadarCategories } = state;
  const { closeDrawer, guardNavigation, handleKeyDown, handleSave, handleSubmit, resetCustomCreationState, setConsiderCurrentTotalBpi, setCreationMode, setCustomFooterState, setDatasetVersion, setIsCustomDirty, setIsDatasetPickerOpen, setIsDrawerOpen, setIsImportModalOpen, setIsSingleBpiTargetOpen, setMaxStepsInput, setSearchMode, setTargetBpiInput, toggleRadarElement, toggleStrategy } = actions;
  return (
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

  );
};
