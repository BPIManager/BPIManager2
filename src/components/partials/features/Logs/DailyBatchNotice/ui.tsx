import { Info, LayoutGrid } from "lucide-react";
import Link from "next/link";
import dayjs from "@/lib/dayjs";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DailyBatchNoticeProps {
  dailyBatchIds: string[];
  currentBatchId: string;
  createdAt: string;
  version: string;
}

export const DailyBatchNotice = ({
  dailyBatchIds,
  currentBatchId,
  createdAt,
  version,
}: DailyBatchNoticeProps) => {
  if (dailyBatchIds.length <= 1) return null;

  const router = useRouter();
  const { userId } = router.query;

  const dateStr = dayjs(createdAt).tz().format("YYYY-MM-DD");
  const currentIndex = dailyBatchIds.indexOf(currentBatchId) + 1;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-blue-800/50 bg-bpim-primary-dim/30 p-4 md:p-5">
      <div
        className="pointer-events-none absolute -right-5 -top-5 text-bpim-text/10"
        aria-hidden="true"
      >
        <LayoutGrid size={120} />
      </div>

      <div className="relative z-10 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-8">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-700/50 bg-bpim-primary-dim/60 text-bpim-primary md:h-12 md:w-12">
            <Info className="h-5 w-5 md:h-6 md:w-6" />
          </div>

          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <span className="text-base font-bold tracking-tight text-bpim-text md:text-lg">
                {dateStr}
              </span>
              <Badge className="rounded-full bg-bpim-primary-dim px-3 py-0.5 text-xs font-semibold text-bpim-primary hover:bg-bpim-primary-dim">
                {currentIndex} / {dailyBatchIds.length} 回目の更新
              </Badge>
            </div>
            <p className="text-xs text-bpim-muted md:whitespace-nowrap md:text-sm">
              合計{dailyBatchIds.length}回のスコア更新が記録されています。
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="group w-full bg-bpim-primary font-bold text-bpim-text shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-bpim-primary hover:shadow-lg md:w-auto md:px-6"
        >
          <Link
            href={`/users/${userId as string}/logs/${version}/summary/${dateStr}`}
          >
            <LayoutGrid className="mr-2 h-4.5 w-4.5" />
            一日のまとめを見る
          </Link>
        </Button>
      </div>
    </div>
  );
};
