import { CircleDashed, Trash2, History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";

export const SavedMemoList = ({
  memos,
  onDelete,
  isDeletingId,
  onSelect,
}: {
  memos: OptimizeMemo[];
  onDelete: (id: string) => void;
  isDeletingId: string | null;
  onSelect: (result: OptimizationResult) => void;
}) => (
  <Accordion type="single" collapsible className="w-full mt-4">
    <AccordionItem value="memos" className="border-bpim-border">
      <AccordionTrigger className="text-sm font-bold text-bpim-muted hover:text-bpim-text py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          保存済みのプラン ({memos.length})
        </div>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-2 pt-1 pb-4">
        {memos.length === 0 && (
          <p className="text-xs text-center py-8 text-bpim-subtle border border-dashed border-bpim-border rounded-lg">
            保存された履歴はありません
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
                  className="font-mono text-[10px] bg-bpim-overlay"
                >
                  目標 {memo.targetBpi.toFixed(2)}
                </Badge>
                <span className="text-[10px] text-bpim-subtle flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(memo.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-bpim-muted hover:text-bpim-danger hover:bg-bpim-danger/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memo.reportId);
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
            <p className="text-[11px] text-bpim-muted">
              {memo.reportData.steps.length} 曲のプラン
            </p>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
