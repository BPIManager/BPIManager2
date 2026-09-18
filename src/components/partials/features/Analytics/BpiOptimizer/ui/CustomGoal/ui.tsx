import { ArrowLeft, CircleDashed, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  OptimizationResult,
  OptimizationStep,
} from "@/types/bpi-optimizer";
import { BpiJourneyBar } from "@/components/partials/common/OptimizerGoalCard";
import { useTranslation } from "@/hooks/common/useTranslation";
import DifficultyBadge from "../DifficultyBadge";
import OptimizationStepCard from "../OptimizationStepCard";
import SongTargetModal, { type CustomGoalTargetInput } from "./SongTargetModal";

interface CustomGoalCreatorUiProps {
  targets: CustomGoalTargetInput[];
  currentScores: Map<number, number | null>;
  /** 編集モード（保存済み目標の編集）では、作成方法選択に戻る導線を隠す */
  isEditing?: boolean;
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
  previewError?: boolean;
}

const TargetRow = ({
  target,
  step,
  maxGain,
  onEdit,
  onRemove,
}: {
  target: CustomGoalTargetInput;
  step?: OptimizationStep;
  maxGain: number;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  if (!step) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-bpim-border bg-bpim-surface p-4">
        <div className="flex min-w-0 items-center gap-2">
          <DifficultyBadge difficulty={target.difficulty} />
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
    );
  }

  return (
    <OptimizationStepCard
      step={step}
      maxGain={maxGain}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );
};

const CustomGoalCreatorUi = ({
  targets,
  currentScores,
  isEditing,
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
  previewError,
}: CustomGoalCreatorUiProps) => {
  const { t } = useTranslation();
  const maxGain =
    preview && preview.steps.length > 0
      ? Math.max(...preview.steps.map((s) => s.bpiGain), 0.01)
      : 0.01;

  return (
    <div className="flex flex-col gap-4">
      {!isEditing && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 self-start text-xs text-bpim-muted hover:text-bpim-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("optimizer.customGoal.backToSelect")}
        </button>
      )}

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
            maxGain={maxGain}
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
          {previewError ? (
            <p className="text-xs text-bpim-danger">
              {t("optimizer.customGoal.previewFailed")}
            </p>
          ) : isPreviewLoading || !preview ? (
            <div className="flex items-center gap-2 text-bpim-muted">
              <CircleDashed className="h-4 w-4 animate-spin" />
              <span className="text-xs">
                {t("optimizer.customGoal.calculating")}
              </span>
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
