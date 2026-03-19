import { useRouter } from "next/router";
import dayjs from "@/lib/dayjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BatchRef {
  batchId: string;
  createdAt: string;
}

interface LogNavigatorProps {
  type: "batch" | "daily" | "weekly" | "monthly";
  pagination: {
    prev: BatchRef | null;
    next: BatchRef | null;
    current: BatchRef;
    prevDate?: string | null;
    nextDate?: string | null;
  };
}

export const LogNavigator = ({ type, pagination }: LogNavigatorProps) => {
  const router = useRouter();

  const formatDateLabel = (dateString: string) => {
    if (type === "daily") {
      return dayjs(dateString).tz().format("M月D日");
    }
    return dayjs(dateString).tz().format("M/D HH:mm");
  };

  const navigateTo = (target: string) => {
    const query = { ...router.query };
    if (type === "batch") {
      query.batchId = target;
    } else {
      query.date = target;
      query.groupedBy = "lastPlayed";
    }

    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  const hasPrev = !!pagination.prev;
  const hasNext = !!pagination.next;

  const prevVal =
    type === "batch"
      ? pagination.prev?.batchId
      : dayjs(pagination.prev?.createdAt).format("YYYY-MM-DD");
  const nextVal =
    type === "batch"
      ? pagination.next?.batchId
      : dayjs(pagination.next?.createdAt).format("YYYY-MM-DD");

  const prevLabel = pagination.prev
    ? formatDateLabel(pagination.prev.createdAt)
    : "---";

  const nextLabel = pagination.next
    ? formatDateLabel(pagination.next?.createdAt)
    : "---";

  const currentLabel = dayjs(pagination.current.createdAt)
    .tz()
    .format("M月D日 HH:mm");

  return (
    <nav className="mb-6 flex w-full items-center justify-between gap-0 rounded-xl border border-bpim-border bg-bpim-bg p-2">
      <div className="flex flex-1 justify-start">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "group flex h-auto items-center px-2 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-primary",
            !hasPrev && "opacity-30",
          )}
          disabled={!hasPrev}
          onClick={() => prevVal && navigateTo(prevVal)}
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          <div className="ml-2 hidden flex-col items-start gap-0 md:flex">
            <span className="text-[10px] tracking-tighter text-bpim-subtle uppercase">
              {type === "batch" ? "PREVIOUS BATCH" : "PREVIOUS DAY"}
            </span>
            <span className="text-xs font-bold leading-tight">{prevLabel}</span>
          </div>
        </Button>
      </div>

      <div className="flex flex-col items-center gap-0 px-4 text-center shrink-0">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          {type === "batch" ? "更新日時" : "対象日"}
        </span>
        <span className="font-mono text-sm font-bold text-bpim-text whitespace-nowrap">
          {currentLabel}
        </span>
      </div>

      <div className="flex flex-1 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "group flex h-auto items-center px-2 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-primary",
            !hasNext && "opacity-30",
          )}
          disabled={!hasNext}
          onClick={() => nextVal && navigateTo(nextVal)}
        >
          <div className="mr-2 hidden flex-col items-end gap-0 md:flex">
            <span className="text-[10px] tracking-tighter text-bpim-subtle uppercase">
              {type === "batch" ? "NEXT BATCH" : "NEXT DAY"}
            </span>
            <span className="text-xs font-bold leading-tight">{nextLabel}</span>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </Button>
      </div>
    </nav>
  );
};
