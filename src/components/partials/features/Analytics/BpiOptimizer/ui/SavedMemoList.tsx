import { useState } from "react";
import { CircleDashed, Trash2, History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

const SavedMemoList = ({
  memos,
  onDelete,
  isDeletingId,
  onSelect,
}: {
  memos: OptimizeMemo[];
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
        {memos.map((memo) => (
          <div
            key={memo.reportId}
            className="group relative flex flex-col gap-2 rounded-lg border border-bpim-border bg-bpim-bg p-3 hover:border-bpim-primary/40 transition-all cursor-pointer"
            onClick={() => onSelect(memo.reportData)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="font-mono text-xs bg-bpim-overlay"
                >
                  {tFormat("optimizer.memo.target", { bpi: memo.targetBpi.toFixed(2) })}
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
            <p className="text-xs text-bpim-muted">
              {tFormat("optimizer.memo.songCount", { count: memo.reportData.steps.length })}
            </p>
          </div>
        ))}
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
