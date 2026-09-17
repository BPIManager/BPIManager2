import NextLink from "next/link";
import { User as FirebaseUser } from "firebase/auth";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashCard } from "@/components/ui/dashcard";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import {
  sortStepsByOrder,
  STEP_SORT_ORDERS,
  type StepSortOrder,
} from "@/components/partials/common/OptimizerGoalCard";
import { GoalDetailDrawer } from "@/components/partials/common/OptimizerGoalCard/GoalDetailDrawer";
import { useTranslation } from "@/hooks/common/useTranslation";
import OptimizerProgressSkeleton from "./skeleton";

interface StepProgress {
  songId: number;
  title: string;
  difficulty: string;
  toExScore: number;
  fromExScore: number | null;
  currentExScore: number | null;
}

interface OptimizerProgressCardProps {
  isLoading: boolean;
  memos?: OptimizeMemo[];
  currentScores: Map<number, number | null>;
  currentBpis: Map<number, number | null>;
  liveCurrentTotalBpi: number | null;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  sortOrder: StepSortOrder;
  onSortOrderChange: (order: StepSortOrder) => void;
  isDetailOpen: boolean;
  onOpenDetail: () => void;
  onCloseDetail: () => void;
  userId?: string;
  fbUser?: FirebaseUser | null;
}

/**
 * 0点始まりの絶対値だと大半の曲でバーが常にほぼ満タンになり差が見えないため、
 * プラン算出時点のスコア(fromExScore、未プレイ時はnull=0点扱い)を起点とした
 * 相対進捗で表示する。
 */
const StepProgressRow = ({
  step,
  onClick,
}: {
  step: StepProgress;
  onClick: () => void;
}) => {
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
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-1 rounded-lg text-left transition-opacity hover:opacity-80"
    >
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
    </button>
  );
};

const OptimizerProgressEmpty = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <span className="text-sm font-bold text-bpim-muted">
        {t("dashboard.optimizerProgress.title")}
      </span>
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
  currentBpis,
  liveCurrentTotalBpi,
  selectedIndex,
  onSelectIndex,
  sortOrder,
  onSortOrderChange,
  isDetailOpen,
  onOpenDetail,
  onCloseDetail,
  userId,
  fbUser,
}: OptimizerProgressCardProps) => {
  const { t, tFormat } = useTranslation();

  if (isLoading) return <OptimizerProgressSkeleton />;
  if (!memos || memos.length === 0) return <OptimizerProgressEmpty />;

  const clampedIndex = Math.min(selectedIndex, memos.length - 1);
  const memo = memos[clampedIndex];
  const steps: StepProgress[] = sortStepsByOrder(
    (memo.reportData.steps ?? []).map((step) => ({
      songId: step.songId,
      title: step.title,
      difficulty: step.difficulty,
      toExScore: step.toExScore,
      fromExScore: step.fromExScore,
      currentExScore: currentScores.get(step.songId) ?? null,
    })),
    sortOrder,
  );

  return (
    <DashCard>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-bpim-muted">
          {t("dashboard.optimizerProgress.title")}
        </span>
        <div className="flex items-center gap-1">
          {memos.length > 1 && (
            <>
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
            </>
          )}
          {steps.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={t(`optimizer.memo.stepSort.${sortOrder}`)}
                  aria-label={t(`optimizer.memo.stepSort.${sortOrder}`)}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STEP_SORT_ORDERS.map((order) => (
                  <DropdownMenuCheckboxItem
                    key={order}
                    checked={sortOrder === order}
                    onCheckedChange={() => onSortOrderChange(order)}
                  >
                    {t(`optimizer.memo.stepSort.${order}`)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <NextLink href="/optimizer">
            <Button
              variant="ghost"
              size="icon-sm"
              title={t("dashboard.optimizerProgress.cta")}
              aria-label={t("dashboard.optimizerProgress.cta")}
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </NextLink>
        </div>
      </div>

      <div className="mt-4 flex max-h-56 flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
        {steps.map((step) => (
          <StepProgressRow key={step.songId} step={step} onClick={onOpenDetail} />
        ))}
      </div>

      <GoalDetailDrawer
        memo={memo}
        currentScores={currentScores}
        currentBpis={currentBpis}
        liveCurrentTotalBpi={liveCurrentTotalBpi}
        isOpen={isDetailOpen}
        onClose={onCloseDetail}
        userId={userId}
        fbUser={fbUser}
      />
    </DashCard>
  );
};

export default OptimizerProgressCard;
