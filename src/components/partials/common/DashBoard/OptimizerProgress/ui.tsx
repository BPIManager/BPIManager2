import NextLink from "next/link";
import { ChevronLeft, ChevronRight, Target, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";
import OptimizerProgressSkeleton from "./skeleton";

interface StepProgress {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  toExScore: number;
  fromExScore: number | null;
  currentExScore: number | null;
}

interface OptimizerProgressCardProps {
  isLoading: boolean;
  memos?: OptimizeMemo[];
  currentScores: Map<number, number | null>;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

const MiniBpiChip = ({ bpi }: { bpi: number }) => {
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

/**
 * 0点始まりの絶対値だと大半の曲でバーが常にほぼ満タンになり差が見えないため、
 * プラン算出時点のスコア(fromExScore、未プレイ時はnull=0点扱い)を起点とした
 * 相対進捗で表示する。
 */
const StepProgressRow = ({ step }: { step: StepProgress }) => {
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
            {step.difficultyLevel}
            {step.difficulty.charAt(0)}
          </span>
          <span className="truncate text-xs font-bold text-bpim-text">
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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bpim-surface-3">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isAchieved ? "bg-bpim-success" : "bg-bpim-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const OptimizerProgressEmpty = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bpim-primary/10 text-bpim-primary">
          <Target className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-bpim-text">
            {t("dashboard.optimizerProgress.emptyTitle")}
          </span>
          <span className="max-w-xs text-xs leading-relaxed text-bpim-muted">
            {t("dashboard.optimizerProgress.emptyDesc")}
          </span>
        </div>
        <NextLink href="/optimizer">
          <Button size="sm" className="mt-1 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {t("dashboard.optimizerProgress.cta")}
          </Button>
        </NextLink>
      </div>
    </DashCard>
  );
};

const OptimizerProgressCard = ({
  isLoading,
  memos,
  currentScores,
  selectedIndex,
  onSelectIndex,
}: OptimizerProgressCardProps) => {
  const { t, tFormat } = useTranslation();

  if (isLoading) return <OptimizerProgressSkeleton />;
  if (!memos || memos.length === 0) return <OptimizerProgressEmpty />;

  const clampedIndex = Math.min(selectedIndex, memos.length - 1);
  const memo = memos[clampedIndex];
  // v2リビルド以前に保存されたメモはreportDataの形が異なりcurrentTotalBpi/
  // targetTotalBpiを持たない場合があるため、無い場合はヘッダー表示を省略する
  const currentTotalBpi = memo.reportData.currentTotalBpi;
  const targetTotalBpi = memo.reportData.targetTotalBpi ?? memo.targetBpi;
  const hasBpiProgress =
    typeof currentTotalBpi === "number" && typeof targetTotalBpi === "number";
  const bpiGap = hasBpiProgress ? targetTotalBpi - currentTotalBpi : 0;
  const steps: StepProgress[] = (memo.reportData.steps ?? []).map((step) => ({
    songId: step.songId,
    title: step.title,
    difficulty: step.difficulty,
    difficultyLevel: step.difficultyLevel,
    toExScore: step.toExScore,
    fromExScore: step.fromExScore,
    currentExScore: currentScores.get(step.songId) ?? null,
  }));

  return (
    <DashCard>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-bpim-muted">
          {t("dashboard.optimizerProgress.title")}
        </span>
        {memos.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={clampedIndex === 0}
              onClick={() => onSelectIndex(clampedIndex - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-11 text-center font-mono text-[11px] font-bold text-bpim-muted">
              {tFormat("dashboard.optimizerProgress.pager", {
                current: clampedIndex + 1,
                total: memos.length,
              })}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={clampedIndex === memos.length - 1}
              onClick={() => onSelectIndex(clampedIndex + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
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

      <div className="mt-4 flex max-h-56 flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
        {steps.map((step) => (
          <StepProgressRow key={step.songId} step={step} />
        ))}
      </div>
    </DashCard>
  );
};

export default OptimizerProgressCard;
