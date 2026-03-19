import { Button } from "@/components/ui/button";
import { ChevronsLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  p: number;
  hasMore: boolean;
  onPageChange: (v: number) => void;
}

export const Pagination = ({ p, hasMore, onPageChange }: Props) => (
  <div className="flex items-center justify-center gap-2 py-4">
    {p !== 1 && (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(1)}
        className="h-9 w-9"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
    )}
    <Button
      variant="outline"
      size="sm"
      disabled={p <= 1}
      onClick={() => onPageChange(p - 1)}
      className="gap-1 px-3"
    >
      <ChevronLeft className="h-4 w-4" />
      前へ
    </Button>

    <div className="px-4">
      <span className="font-mono text-sm font-bold text-bpim-text">
        PAGE {p}
      </span>
    </div>

    <Button
      variant="outline"
      size="sm"
      disabled={!hasMore}
      onClick={() => onPageChange(p + 1)}
      className="gap-1 px-3"
    >
      次へ
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);
