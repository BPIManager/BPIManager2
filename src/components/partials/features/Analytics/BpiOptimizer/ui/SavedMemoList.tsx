import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { CircleDashed, Trash2, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { buildStepProgress } from "@/components/partials/common/OptimizerGoalCard";
import { SongStatusBar } from "@/components/partials/common/OptimizerGoalCard/GoalCard";
import { GoalDetailDrawer } from "@/components/partials/common/OptimizerGoalCard/GoalDetailDrawer";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

type StatusFilter = "all" | "unachieved" | "achieved";
const STATUS_FILTERS: StatusFilter[] = ["all", "unachieved", "achieved"];

/**
 * 目標全体の達成判定。総合BPI(べき乗平均)が目標を超えたかではなく、
 * 目標に含めた曲が全曲達成したかで決める（GoalBpiJourneyと同じ基準）。
 * 一部の曲の超過達成だけで総合BPIが目標を超えることがあり、それを
 * 「達成」扱いにするのは実態と合わないため。
 */
const isMemoAchieved = (
  memo: OptimizeMemo,
  currentScores: Map<number, number | null>,
  currentBpis: Map<number, number | null>,
): boolean => {
  const steps = buildStepProgress(memo, currentScores, currentBpis);
  return (
    steps.length > 0 &&
    steps.every(
      (s) => s.currentExScore != null && s.currentExScore >= s.toExScore,
    )
  );
};

const SavedMemoList = ({
  memos,
  currentScores,
  currentBpis,
  liveCurrentTotalBpi,
  userId,
  fbUser,
  onDelete,
  isDeletingId,
}: {
  memos: OptimizeMemo[];
  currentScores: Map<number, number | null>;
  currentBpis: Map<number, number | null>;
  liveCurrentTotalBpi: number | null;
  userId?: string;
  fbUser?: FirebaseUser | null;
  onDelete: (id: string) => void;
  isDeletingId: string | null;
}) => {
  const { t, tFormat } = useTranslation();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [openMemoId, setOpenMemoId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const visibleMemos = memos.filter((memo) => {
    if (statusFilter === "all") return true;
    const achieved = isMemoAchieved(memo, currentScores, currentBpis);
    return statusFilter === "achieved" ? achieved : !achieved;
  });

  const openMemo = memos.find((memo) => memo.reportId === openMemoId) ?? null;

  return (
    <>
      {memos.length > 0 && (
        <div className="flex min-w-0 gap-1 mb-4 rounded-lg bg-bpim-overlay/30 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "flex-1 truncate rounded-md py-1.5 text-xs font-bold transition-colors",
                statusFilter === filter
                  ? "bg-bpim-primary text-white"
                  : "text-bpim-muted hover:text-bpim-text",
              )}
            >
              {t(`optimizer.memo.statusFilter.${filter}`)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 w-full">
        {memos.length > 0 && visibleMemos.length === 0 && (
          <p className="text-xs text-center py-8 text-bpim-subtle border border-dashed border-bpim-border rounded-lg">
            {t("optimizer.memo.noMatch")}
          </p>
        )}
        {memos.length === 0 && (
          <p className="text-xs text-center py-8 text-bpim-subtle border border-dashed border-bpim-border rounded-lg">
            {t("optimizer.memo.empty")}
          </p>
        )}
        {visibleMemos.map((memo) => {
          const isAuto = memo.kind !== "custom";
          const steps = buildStepProgress(memo, currentScores, currentBpis);
          const achievedCount = steps.filter(
            (s) => s.currentExScore != null && s.currentExScore >= s.toExScore,
          ).length;
          const isAchieved = steps.length > 0 && achievedCount === steps.length;
          return (
            <div
              key={memo.reportId}
              onClick={() => setOpenMemoId(memo.reportId)}
              className="flex cursor-pointer flex-col gap-2 rounded-lg border border-bpim-border bg-bpim-bg p-3 transition-colors hover:border-bpim-primary/40"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs shrink-0",
                    isAuto
                      ? "bg-bpim-overlay"
                      : "bg-bpim-primary/15 text-bpim-primary",
                  )}
                >
                  {isAuto
                    ? t("optimizer.memo.kind.auto")
                    : t("optimizer.memo.kind.custom")}
                </Badge>
                <span className="text-xs text-bpim-subtle flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {new Date(memo.createdAt).toLocaleDateString()}
                </span>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {isAchieved && (
                    <Badge className="bg-bpim-success text-[10px] font-black uppercase tracking-wide text-white">
                      {t("dashboard.optimizerProgress.achieved")}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-bpim-muted hover:text-bpim-danger hover:bg-bpim-danger/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(memo.reportId);
                    }}
                    disabled={isDeletingId === memo.reportId}
                  >
                    {isDeletingId === memo.reportId ? (
                      <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <ChevronRight className="h-4 w-4 text-bpim-muted" />
                </div>
              </div>

              {steps.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-mono text-[11px] font-bold text-bpim-muted">
                    {tFormat("optimizer.bpiJourney.songsAchieved", {
                      achieved: achievedCount,
                      total: steps.length,
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SongStatusBar steps={steps} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GoalDetailDrawer
        memo={openMemo}
        currentScores={currentScores}
        currentBpis={currentBpis}
        liveCurrentTotalBpi={liveCurrentTotalBpi}
        isOpen={openMemo !== null}
        onClose={() => setOpenMemoId(null)}
        userId={userId}
        fbUser={fbUser}
      />

      <ActionConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) onDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={t("optimizer.memo.deleteTitle")}
        description={t("optimizer.memo.deleteDesc")}
        confirmLabel={t("optimizer.memo.deleteConfirm")}
        isDestructive
      />
    </>
  );
};

export default SavedMemoList;
