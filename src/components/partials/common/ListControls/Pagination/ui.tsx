import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const PAGE_SIZE_OPTIONS: (number | null)[] = [10, 20, 50, 100, null];
const PAGE_SIZE_LABEL = (size: number | null) => (size === null ? "ALL" : `${size}`);

interface CustomPaginationProps {
  count: number;
  pageSize: number | null;
  page: number;
  onPageChange: (page: number) => void;
  isSticky?: boolean;
  onPageSizeChange?: (size: number | null) => void;
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
  onPageSizeChange,
}: CustomPaginationProps) => {
  const effectivePageSize = pageSize ?? count;
  if (count <= effectivePageSize && !onPageSizeChange) return null;

  const totalPages = pageSize === null ? 1 : Math.ceil(count / pageSize);
  const pageList = buildPageList(page, totalPages);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center transition-all",
        isSticky
          ? "sticky bottom-0 z-30 h-14 border-t border-bpim-border bg-bpim-bg/80 backdrop-blur-xl"
          : "py-4",
      )}
    >
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize === null ? "null" : String(pageSize)}
            onChange={(e) =>
              onPageSizeChange(e.target.value === "null" ? null : Number(e.target.value))
            }
            className="h-8 rounded-md border border-bpim-border bg-bpim-bg px-2 font-mono text-xs text-bpim-text focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={String(opt)} value={opt === null ? "null" : String(opt)}>
                {PAGE_SIZE_LABEL(opt)}
              </option>
            ))}
          </select>
        )}

        {totalPages > 1 && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
