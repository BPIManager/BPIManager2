import { useState } from "react";
import { CircleDashed, Trash2, History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { OptimizerGoalContent } from "@/components/partials/common/OptimizerGoalCard";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

const SavedMemoList = ({
  memos,
  currentScores,
  onDelete,
  isDeletingId,
  onSelect,
}: {
  memos: OptimizeMemo[];
  currentScores: Map<number, number | null>;
  onDelete: (id: string) => void;
  isDeletingId: string | null;
  onSelect: (result: OptimizationResult) => void;
}) => {
  const { t, tFormat } = useTranslation();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 text-sm font-bold text-bpim-muted py-1">
          <History className="h-4 w-4" />
          {tFormat("optimizer.memo.header", { count: memos.length })}
        </div>

        {memos.length === 0 && (
          <p className="text-xs text-center py-8 text-bpim-subtle border border-dashed border-bpim-border rounded-lg">
            {t("optimizer.memo.empty")}
          </p>
        )}
        {memos.map((memo) => {
          const isAuto = memo.kind !== "custom";
          return (
            <div
              key={memo.reportId}
              className={cn(
                "group relative flex flex-col gap-3 rounded-lg border border-bpim-border bg-bpim-bg p-3 transition-all",
                isAuto && "hover:border-bpim-primary/40 cursor-pointer",
              )}
              onClick={() => isAuto && onSelect(memo.reportData)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isAuto
                        ? "bg-bpim-overlay"
                        : "bg-bpim-primary/15 text-bpim-primary",
                    )}
                  >
                    {isAuto
                      ? t("optimizer.memo.kind.auto")
                      : t("optimizer.memo.kind.custom")}
                  </Badge>
                  <span className="text-xs text-bpim-subtle flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(memo.createdAt).toLocaleDateString()}
                  </span>
                </div>
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
              </div>

              <OptimizerGoalContent
                memo={memo}
                currentScores={currentScores}
              />
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
