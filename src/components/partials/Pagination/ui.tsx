import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CustomPagination = ({
  count,
  pageSize,
  page,
  onPageChange,
  isSticky = true,
}: any) => {
  if (count <= pageSize) return null;
  const totalPages = Math.ceil(count / pageSize);

  const content = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1 px-2">
        <span className="font-mono text-sm font-bold text-bpim-text">
          PAGE {page}
        </span>
        <span className="text-xs text-bpim-muted">/ {totalPages}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center transition-all",
        isSticky
          ? "sticky bottom-0 z-30 h-16 border-t border-bpim-border bg-bpim-bg/60 backdrop-blur-xl"
          : "py-4",
      )}
    >
      {content}
    </div>
  );
};
