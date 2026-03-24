import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface CustomPaginationProps {
  count: number;
  pageSize: number;
  page: number;
  onPageChange: (page: number) => void;
  isSticky?: boolean;
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  const addRange = (start: number, end: number) => {
    for (let i = start; i <= end; i++) pages.push(i);
  };

  pages.push(1);

  if (current <= 4) {
    addRange(2, Math.min(5, total - 1));
    if (total > 6) pages.push("...");
  } else if (current >= total - 3) {
    pages.push("...");
    addRange(Math.max(total - 4, 2), total - 1);
  } else {
    pages.push("...");
    addRange(current - 1, current + 1);
    pages.push("...");
  }

  pages.push(total);
  return pages;
}

export const CustomPagination = ({
  count,
  pageSize,
  page,
  onPageChange,
  isSticky = true,
}: CustomPaginationProps) => {
  if (count <= pageSize) return null;
  const totalPages = Math.ceil(count / pageSize);
  const pageList = buildPageList(page, totalPages);

  const content = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="前のページ"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageList.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-bpim-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 font-mono text-xs",
              p === page
                ? "bg-bpim-primary/20 text-bpim-primary font-bold"
                : "text-bpim-muted hover:text-bpim-text",
            )}
            onClick={() => onPageChange(p as number)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="次のページ"
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
          ? "sticky bottom-0 z-30 h-14 border-t border-bpim-border bg-bpim-bg/80 backdrop-blur-xl"
          : "py-4",
      )}
    >
      {content}
    </div>
  );
};
