import { useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { CircleDashed, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { buildStepProgress } from "@/components/partials/common/OptimizerGoalCard";
import { fetchSongContribution } from "@/services/swr/analytics";
import { GoalBpiJourney, GoalSongCard, type GoalSongStep } from "./GoalCard";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

type StatusFilter = "all" | "unachieved" | "achieved";
const STATUS_FILTERS: StatusFilter[] = ["all", "unachieved", "achieved"];

/** GoalBpiJourneyの達成判定（現在の総合BPI >= 目標総合BPI）と同じ基準で目標全体の達成状況を判定する。 */
const isMemoAchieved = (
  memo: OptimizeMemo,
  liveCurrentTotalBpi: number | null,
): boolean => {
  const targetTotalBpi = memo.reportData.targetTotalBpi ?? memo.targetBpi;
  const currentTotalBpi = liveCurrentTotalBpi ?? memo.reportData.currentTotalBpi;
  if (typeof currentTotalBpi !== "number" || typeof targetTotalBpi !== "number") {
    return false;
  }
  return currentTotalBpi >= targetTotalBpi;
};

/**
 * 展開時のみ、保存時点からの実際のスコア更新が現在の総合BPIにどれだけ
 * 効いているかをAPIから取得する（折りたたみ中の全メモ分を一括で叩かない
 * ように、展開されたメモ単位で遅延フェッチする）。
 */
const ExpandedSteps = ({
  memo,
  steps,
  userId,
  fbUser,
}: {
  memo: OptimizeMemo;
  steps: GoalSongStep[];
  userId?: string;
  fbUser?: FirebaseUser | null;
}) => {
  const [contributions, setContributions] = useState<Map<number, number> | null>(
    null,
  );

  useEffect(() => {
    if (!userId || steps.length === 0) return;
    let cancelled = false;
    fetchSongContribution(
      userId,
      fbUser,
      steps.map((s) => ({ songId: s.songId, baselineExScore: s.fromExScore })),
    )
      .then((res) => {
        if (cancelled) return;
        setContributions(
          new Map(res.contributions.map((c) => [c.songId, c.contribution])),
        );
      })
      .catch(() => {
        if (!cancelled) setContributions(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memo.reportId, userId]);

  return (
    <div className="flex flex-col gap-3 border-t border-bpim-border p-3">
      {steps.map((step) => (
        <GoalSongCard
          key={step.songId}
          step={step}
          contribution={contributions?.get(step.songId) ?? null}
        />
      ))}
    </div>
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
  const { t } = useTranslation();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // 同時に開けるのは1つまで（アコーディオン形式）
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const visibleMemos = memos.filter((memo) => {
    if (statusFilter === "all") return true;
    const achieved = isMemoAchieved(memo, liveCurrentTotalBpi);
    return statusFilter === "achieved" ? achieved : !achieved;
  });

  return (
    <>
      {memos.length > 0 && (
        <div className="flex min-w-0 gap-1 rounded-lg bg-bpim-overlay/30 p-1">
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
          const isExpanded = expandedId === memo.reportId;
          const steps = buildStepProgress(memo, currentScores, currentBpis);
          return (
            <div
              key={memo.reportId}
              className={cn(
                "rounded-lg border border-bpim-border bg-bpim-bg overflow-hidden",
                !isExpanded && "cursor-pointer",
              )}
              onClick={() => {
                if (!isExpanded) toggleExpanded(memo.reportId);
              }}
            >
              <div className="flex items-center gap-1 p-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(memo.reportId);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
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
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-bpim-muted ml-auto shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-bpim-muted ml-auto shrink-0" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-bpim-muted hover:text-bpim-danger hover:bg-bpim-danger/10 shrink-0"
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
              </div>

              <div className="px-3 pb-3">
                <GoalBpiJourney
                  memo={memo}
                  liveCurrentTotalBpi={liveCurrentTotalBpi}
                  steps={steps}
                  isExpanded={isExpanded}
                />
              </div>

              {isExpanded && (
                <ExpandedSteps
                  memo={memo}
                  steps={steps}
                  userId={userId}
                  fbUser={fbUser}
                />
              )}
            </div>
          );
        })}
      </div>

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
