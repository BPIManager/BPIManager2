import { Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OptimizationStep } from "@/types/bpi-optimizer";
import BpiChangeChips from "./BpiChangeChips";
import DifficultyBadge from "./DifficultyBadge";
import { RADAR_LABELS } from "./shared";
import { useTranslation } from "@/hooks/common/useTranslation";

const OptimizationStepCard = ({
  step,
  maxGain,
  onEdit,
  onRemove,
}: {
  step: OptimizationStep;
  maxGain: number;
  /** 指定すると曲名の右側にランク数字の代わりに編集・削除ボタンを出す（目標曲編集用） */
  onEdit?: () => void;
  onRemove?: () => void;
}) => {
  const { t } = useTranslation();
  const impactWidth = Math.min(100, (step.bpiGain / maxGain) * 100);

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-bpim-border bg-bpim-surface p-4 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          {onEdit || onRemove ? (
            <div className="flex shrink-0 items-start gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-bpim-muted hover:text-bpim-danger hover:bg-bpim-danger/10"
                  onClick={onRemove}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-bpim-bg flex items-center justify-center shrink-0 border border-bpim-border font-black text-bpim-muted transition-colors">
              {step.rank}
            </div>
          )}
          <div className="min-w-0 flex flex-col gap-1">
            <h3 className="text-sm font-black text-bpim-text truncate leading-tight">
              {step.title}
            </h3>
            <div className="flex items-center gap-2">
              <DifficultyBadge difficulty={step.difficulty} />
              {step.radarCategory && (
                <span className="text-xs font-bold text-bpim-subtle px-2 py-0.5 bg-bpim-bg rounded-full border border-bpim-border">
                  {RADAR_LABELS[step.radarCategory]}
                </span>
              )}
              {step.isRadarStrength && (
                <Badge className="bg-bpim-warning/15 text-bpim-warning border-bpim-warning/30 text-xs h-4">
                  <Star className="h-2 w-2 mr-1 fill-bpim-warning" />{" "}
                  {t("optimizer.step.mightBeStrong")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-black text-bpim-primary">
            EX +{step.exScoreGap}
          </div>
          <div className="text-xs text-bpim-muted font-bold">
            {t("optimizer.step.targetLabel")}: {step.toExScore}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-xs font-black text-bpim-subtle uppercase tracking-widest">
            {t("optimizer.step.impact")}
          </span>
          <span className="text-xs font-mono font-bold text-bpim-primary">
            +{step.bpiGain.toFixed(2)}
          </span>
        </div>
        <div className="h-1.5 w-full bg-bpim-bg rounded-full overflow-hidden border border-bpim-border/50">
          <div
            className="h-full bg-linear-to-r from-bpim-primary/50 to-bpim-primary transition-all duration-1000"
            style={{ width: `${impactWidth}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-bpim-border/50">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black text-bpim-subtle uppercase tracking-widest leading-none">
            {t("optimizer.step.bpiChange")}
          </span>
          <div className="flex items-center gap-2">
            <BpiChangeChips fromBpi={step.fromBpi} toBpi={step.toBpi} />
            <span className="text-xs font-bold text-bpim-primary ml-1">
              (+{(step.toBpi - step.fromBpi).toFixed(1)})
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col justify-end">
          <span className="text-xs font-black text-bpim-subtle uppercase tracking-widest leading-none">
            {t("optimizer.step.totalBpiAfter")}
          </span>
          <div className="text-sm font-black text-bpim-text font-mono leading-tight mt-1">
            {step.cumulativeTotalBpi.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationStepCard;
