import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Info,
  CircleDashed,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { BpiChip } from "./BpiChip";

interface OptimizationSummaryProps {
  result: OptimizationResult;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export const OptimizationSummary = ({
  result,
  onSave,
  isSaving,
  isSaved,
}: OptimizationSummaryProps) => {
  const {
    currentTotalBpi,
    targetTotalBpi,
    achievable,
    alreadyAchieved,
    steps,
    autoAdjustmentNote,
    originalTargetTotalBpi,
    maxAchievableBpi,
  } = result;
  const finalBpi =
    steps.length > 0
      ? steps[steps.length - 1].cumulativeTotalBpi
      : currentTotalBpi;

  if (alreadyAchieved) {
    return (
      <div className="rounded-xl border border-bpim-success/40 bg-bpim-success/10 p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-bpim-success shrink-0" />
        <p className="text-sm font-bold text-bpim-success">
          目標 BPI {targetTotalBpi} は既に達成されています！
        </p>
      </div>
    );
  }

  if (!achievable) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-bpim-warning/40 bg-bpim-warning/5 p-4 flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-bpim-warning shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-bpim-warning">
                指定された条件では目標 BPI {targetTotalBpi}{" "}
                に到達できませんでした
              </p>
              {maxAchievableBpi !== undefined && steps.length > 0 && (
                <p className="text-xs text-bpim-muted">
                  このメニュー（{steps.length}曲）で到達できる最大総合BPIは
                  <span className="font-bold text-bpim-text mx-1">
                    {maxAchievableBpi.toFixed(2)}
                  </span>
                  です。
                </p>
              )}
              <p className="text-xs text-bpim-subtle mt-1">
                曲数を増やすか、目標値を下げて再計算してみてください。
              </p>
            </div>
          </div>
        </div>
        {steps.length > 0 && (
          <div className="rounded-xl border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-3">
            <p className="text-xs text-bpim-muted font-bold">
              部分達成ルート（参考）
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <BpiChip bpi={currentTotalBpi} />
              <ArrowRight className="h-4 w-4 text-bpim-muted shrink-0" />
              <BpiChip bpi={finalBpi} />
              <Badge
                variant="outline"
                className="border-bpim-warning/50 text-bpim-warning text-xs"
              >
                目標まで残 {(targetTotalBpi - finalBpi).toFixed(2)}
              </Badge>
            </div>
            <p className="text-xs text-bpim-muted">
              {steps.length} 曲の改善で総合 BPI 約
              <span className="font-bold text-bpim-text mx-1">
                +{(finalBpi - currentTotalBpi).toFixed(2)}
              </span>
              向上
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {autoAdjustmentNote && (
        <div className="rounded-xl border border-bpim-primary/30 bg-bpim-primary/5 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-bpim-primary shrink-0 mt-0.5" />
          <p className="text-xs text-bpim-primary leading-snug">
            {autoAdjustmentNote}
            {originalTargetTotalBpi !== undefined && (
              <span className="text-bpim-muted ml-1">
                （元の目標: {originalTargetTotalBpi.toFixed(2)}）
              </span>
            )}
          </p>
        </div>
      )}
      <div className="rounded-xl border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <BpiChip bpi={currentTotalBpi} />
            <ArrowRight className="h-4 w-4 text-bpim-muted shrink-0" />
            <BpiChip bpi={finalBpi} />
            {finalBpi >= targetTotalBpi ? (
              <Badge className="bg-bpim-success/20 text-bpim-success border-bpim-success/30 text-xs">
                目標達成
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-bpim-warning/50 text-bpim-warning text-xs"
              >
                目標まで残 {(targetTotalBpi - finalBpi).toFixed(2)}
              </Badge>
            )}
          </div>

          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving || isSaved}
              className="border-bpim-primary/40 text-bpim-primary hover:bg-bpim-primary/10 gap-2 h-8 text-xs font-bold disabled:opacity-50"
            >
              {isSaving ? (
                <CircleDashed className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaved ? "保存済み" : "結果を保存"}
            </Button>
          )}
        </div>
        <p className="text-xs text-bpim-muted">
          {steps.length} 曲の改善で
          <span className="font-bold text-bpim-text mx-1">
            +{(finalBpi - currentTotalBpi).toFixed(2)}
          </span>
          BPI 向上
        </p>
      </div>
    </div>
  );
};
