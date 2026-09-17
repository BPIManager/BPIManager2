import NextLink from "next/link";
import { ChevronLeft, ChevronRight, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashCard } from "@/components/ui/dashcard";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { OptimizerGoalContent } from "@/components/partials/common/OptimizerGoalCard";
import { useTranslation } from "@/hooks/common/useTranslation";
import OptimizerProgressSkeleton from "./skeleton";

interface OptimizerProgressCardProps {
  isLoading: boolean;
  memos?: OptimizeMemo[];
  currentScores: Map<number, number | null>;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

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

      <div className="mt-3">
        <OptimizerGoalContent
          memo={memo}
          currentScores={currentScores}
          stepsClassName="mt-4 max-h-56 overflow-y-auto custom-scrollbar pr-1"
        />
      </div>
    </DashCard>
  );
};

export default OptimizerProgressCard;
