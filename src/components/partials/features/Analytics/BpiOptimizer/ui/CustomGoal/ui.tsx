import { ArrowLeft, ArrowRight, CircleDashed, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import BpiChip from "../BpiChip";
import { useTranslation } from "@/hooks/common/useTranslation";
import SongTargetModal, { type CustomGoalTargetInput } from "./SongTargetModal";

interface CustomGoalCreatorUiProps {
  targets: CustomGoalTargetInput[];
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

const CustomGoalCreatorUi = ({
  targets,
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
  const { t, tFormat } = useTranslation();
  const bpiGap = preview ? preview.targetTotalBpi - preview.currentTotalBpi : 0;

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
          <div
            key={`${target.songId}-${index}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-bpim-border bg-bpim-surface p-3"
          >
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
              <span className="shrink-0 font-mono text-xs text-bpim-muted">
                EX {target.toExScore}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEditClick(index)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-bpim-muted hover:text-bpim-danger hover:bg-bpim-danger/10"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={onAddClick}
        className="gap-1.5 self-start"
      >
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
            <div className="flex items-center gap-2 flex-wrap">
              <BpiChip bpi={preview.currentTotalBpi} />
              <ArrowRight className="h-4 w-4 text-bpim-muted shrink-0" />
              <BpiChip bpi={preview.targetTotalBpi} />
              {bpiGap > 0 ? (
                <Badge
                  variant="outline"
                  className="border-bpim-warning/50 text-bpim-warning text-xs"
                >
                  {tFormat("optimizer.summary.remaining", { diff: bpiGap.toFixed(2) })}
                </Badge>
              ) : (
                <Badge className="bg-bpim-success/20 text-bpim-success border-bpim-success/30 text-xs">
                  {t("optimizer.summary.achieved")}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={onSave}
        disabled={!preview || isPreviewLoading || isSaving}
        className="gap-2 self-start"
      >
        {isSaving && <CircleDashed className="h-4 w-4 animate-spin" />}
        {t("optimizer.customGoal.save")}
      </Button>

      <SongTargetModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onConfirm={onModalConfirm}
        initialTarget={editingTarget}
      />
    </div>
  );
};

export default CustomGoalCreatorUi;
