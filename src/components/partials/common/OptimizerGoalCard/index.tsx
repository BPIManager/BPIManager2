import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

interface StepProgress {
  songId: number;
  title: string;
  difficulty: string;
  toExScore: number;
  fromExScore: number | null;
  currentExScore: number | null;
}

/**
 * ダッシュボードの達成状況ウィジェット(`OptimizerProgress`)と「目標管理」タブの
 * `SavedMemoList`で共有する、Optimizerメモ1件分の見た目（BPI推移ヘッダー＋
 * 曲別の相対プログレスバー）。1件ずつページャで切り替えるか全件並べるかは
 * 呼び出し側が決める。
 */

export const MiniBpiChip = ({ bpi }: { bpi: number }) => {
  const { bg, color } = getBpiColorStyle(bpi);
  return (
    <span
      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-xs font-bold"
      style={{ backgroundColor: bg, color }}
    >
      {bpi.toFixed(2)}
    </span>
  );
};

export const BpiProgressHeader = ({ memo }: { memo: OptimizeMemo }) => {
  const { t, tFormat } = useTranslation();
  // v2リビルド以前に保存されたメモはreportDataの形が異なりcurrentTotalBpi/
  // targetTotalBpiを持たない場合があるため、無い場合はヘッダー表示を省略する
  const currentTotalBpi = memo.reportData.currentTotalBpi;
  const targetTotalBpi = memo.reportData.targetTotalBpi ?? memo.targetBpi;
  const hasBpiProgress =
    typeof currentTotalBpi === "number" && typeof targetTotalBpi === "number";
  const bpiGap = hasBpiProgress ? targetTotalBpi - currentTotalBpi : 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasBpiProgress ? (
        <>
          <MiniBpiChip bpi={currentTotalBpi} />
          <ArrowRight className="h-3.5 w-3.5 text-bpim-muted shrink-0" />
          <MiniBpiChip bpi={targetTotalBpi} />
          {bpiGap > 0 ? (
            <Badge
              variant="outline"
              className="border-bpim-warning/50 text-bpim-warning text-xs"
            >
              {tFormat("dashboard.optimizerProgress.bpiRemaining", {
                diff: bpiGap.toFixed(2),
              })}
            </Badge>
          ) : (
            <Badge className="bg-bpim-success/20 text-bpim-success border-bpim-success/30 text-xs">
              {t("dashboard.optimizerProgress.achieved")}
            </Badge>
          )}
        </>
      ) : (
        <MiniBpiChip bpi={targetTotalBpi} />
      )}
    </div>
  );
};

export const StepProgressRow = ({ step }: { step: StepProgress }) => {
  const { t, tFormat } = useTranslation();
  const current = step.currentExScore;
  const baseline = step.fromExScore ?? 0;
  const isAchieved = current != null && current >= step.toExScore;
  const span = step.toExScore - baseline;
  const pct = isAchieved
    ? 100
    : current == null || span <= 0
      ? 0
      : Math.min(100, Math.max(0, ((current - baseline) / span) * 100));
  const remaining = Math.max(0, step.toExScore - (current ?? 0));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "shrink-0 rounded px-1 py-0.5 text-[10px] font-black text-white",
              DIFF_COLORS[step.difficulty],
            )}
          >
            {step.difficulty.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-bold text-bpim-text">
            {step.title}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-[11px] font-bold",
            isAchieved ? "text-bpim-success" : "text-bpim-muted",
          )}
        >
          {isAchieved
            ? t("dashboard.optimizerProgress.achieved")
            : current == null
              ? tFormat("dashboard.optimizerProgress.remainingUnplayed", {
                  diff: remaining,
                })
              : tFormat("dashboard.optimizerProgress.remaining", {
                  diff: remaining,
                })}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bpim-muted/15">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isAchieved ? "bg-bpim-success" : "bg-bpim-primary",
          )}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
    </div>
  );
};

export const buildStepProgress = (
  memo: OptimizeMemo,
  currentScores: Map<number, number | null>,
): StepProgress[] =>
  (memo.reportData.steps ?? []).map((step) => ({
    songId: step.songId,
    title: step.title,
    difficulty: step.difficulty,
    toExScore: step.toExScore,
    fromExScore: step.fromExScore,
    currentExScore: currentScores.get(step.songId) ?? null,
  }));

/** BPI推移ヘッダー＋曲別プログレスバーをまとめた、メモ1件分の中身。 */
export const OptimizerGoalContent = ({
  memo,
  currentScores,
  stepsClassName,
}: {
  memo: OptimizeMemo;
  currentScores: Map<number, number | null>;
  stepsClassName?: string;
}) => {
  const steps = buildStepProgress(memo, currentScores);

  return (
    <>
      <BpiProgressHeader memo={memo} />
      <div className={cn("flex flex-col gap-3", stepsClassName)}>
        {steps.map((step) => (
          <StepProgressRow key={step.songId} step={step} />
        ))}
      </div>
    </>
  );
};
