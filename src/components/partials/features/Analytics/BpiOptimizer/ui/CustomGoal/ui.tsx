import { ArrowLeft, ArrowRight, CircleDashed, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import type { OptimizationResult, OptimizationStep } from "@/types/bpi-optimizer";
import { BpiJourneyBar, MiniBpiChip } from "@/components/partials/common/OptimizerGoalCard";
import { useTranslation } from "@/hooks/common/useTranslation";
import SongTargetModal, { type CustomGoalTargetInput } from "./SongTargetModal";

interface CustomGoalCreatorUiProps {
  targets: CustomGoalTargetInput[];
  currentScores: Map<number, number | null>;
  onBack: () => void;
  onAddClick: () => void;
  onEditClick: (index: number) => void;
  onRemove: (index: number) => void;
  isModalOpen: boolean;
  editingTarget?: CustomGoalTargetInput;
  onModalClose: () => void;
  onModalConfirm: (target: CustomGoalTargetInput) => void;
  preview: OptimizationResult | null;
  isPreviewLoading: boolean;
  onSave: () => void;
  isSaving: boolean;
}

const scoreRate = (score: number, notes: number) =>
  notes > 0 ? (score / (notes * 2)) * 100 : 0;

const TargetRow = ({
  target,
  step,
  onEdit,
  onRemove,
}: {
  target: CustomGoalTargetInput;
  step?: OptimizationStep;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const currentEx = step?.fromExScore ?? null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-bpim-border bg-bpim-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-xs font-black text-white",
              DIFF_COLORS[target.difficulty],
            )}
          >
            {target.difficultyLevel}
            {target.difficulty.charAt(0)}
          </span>
          <span className="truncate text-sm font-bold text-bpim-text">
            {target.title}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-bpim-muted hover:text-bpim-danger hover:bg-bpim-danger/10"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 font-mono text-xs">
        <span className="text-bpim-muted">
          {currentEx != null
            ? `${currentEx} (${scoreRate(currentEx, target.notes).toFixed(2)}%)`
            : t("optimizer.customGoal.unplayed")}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-bpim-muted shrink-0" />
        <span className="font-bold text-bpim-text">
          {target.toExScore} ({scoreRate(target.toExScore, target.notes).toFixed(2)}%)
        </span>
      </div>

      {step && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-bpim-subtle">
              {t("optimizer.customGoal.songBpi")}
            </span>
            <MiniBpiChip bpi={step.fromBpi} />
            <ArrowRight className="h-3.5 w-3.5 text-bpim-muted shrink-0" />
            <MiniBpiChip bpi={step.toBpi} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-bpim-subtle">
              {t("optimizer.customGoal.totalBpiImpact")}
            </span>
            <span className="font-mono text-xs font-bold text-bpim-primary">
              +{step.bpiGain.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomGoalCreatorUi = ({
  targets,
  currentScores,
  onBack,
  onAddClick,
  onEditClick,
  onRemove,
  isModalOpen,
  editingTarget,
  onModalClose,
  onModalConfirm,
  preview,
  isPreviewLoading,
  onSave,
  isSaving,
}: CustomGoalCreatorUiProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 self-start text-xs text-bpim-muted hover:text-bpim-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("optimizer.customGoal.backToSelect")}
      </button>

      <div className="flex flex-col gap-2">
        {targets.length === 0 && (
          <p className="rounded-xl border border-dashed border-bpim-border py-8 text-center text-xs text-bpim-subtle">
            {t("optimizer.customGoal.empty")}
          </p>
        )}
        {targets.map((target, index) => (
          <TargetRow
            key={`${target.songId}-${index}`}
            target={target}
            step={preview?.steps[index]}
            onEdit={() => onEditClick(index)}
            onRemove={() => onRemove(index)}
          />
        ))}
      </div>

      <Button variant="outline" onClick={onAddClick} className="w-full gap-1.5">
        <Plus className="h-4 w-4" />
        {t("optimizer.customGoal.addSong")}
      </Button>

      {targets.length > 0 && (
        <div className="rounded-xl border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-bpim-muted">
            {t("optimizer.customGoal.bpiImpact")}
          </p>
          {isPreviewLoading || !preview ? (
            <div className="flex items-center gap-2 text-bpim-muted">
              <CircleDashed className="h-4 w-4 animate-spin" />
              <span className="text-xs">{t("optimizer.customGoal.calculating")}</span>
            </div>
          ) : (
            <BpiJourneyBar
              current={preview.currentTotalBpi}
              to={preview.targetTotalBpi}
              showAchievedState={false}
            />
          )}
        </div>
      )}

      <Button
        onClick={onSave}
        disabled={!preview || isPreviewLoading || isSaving}
        className="w-full gap-2"
      >
        {isSaving && <CircleDashed className="h-4 w-4 animate-spin" />}
        {t("optimizer.customGoal.save")}
      </Button>

      <SongTargetModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onConfirm={onModalConfirm}
        initialTarget={editingTarget}
        currentScores={currentScores}
      />
    </div>
  );
};

export default CustomGoalCreatorUi;
