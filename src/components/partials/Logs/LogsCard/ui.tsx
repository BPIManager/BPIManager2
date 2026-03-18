import { LuListMusic, LuCalendar } from "react-icons/lu";
import Link from "next/link";
import { UpdateLog } from "@/hooks/batches/useBatchesList";
import dayjs from "@/lib/dayjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const LogsCard = ({ log }: { log: UpdateLog }) => {
  const router = useRouter();
  const userId = router.query.userId as string;
  const groupedBy = (router.query.groupedBy as string) || "lastPlayed";
  const isPositive = log.diff >= 0;

  const linkHref = useMemo(() => {
    const basePath = `/users/${userId}/logs/${log.version}`;
    const targetPath =
      groupedBy === "lastPlayed"
        ? `${basePath}/summary/${log.batchId}`
        : `${basePath}/${log.batchId}`;

    return {
      pathname: targetPath,
      query: { groupedBy },
    };
  }, [userId, log.version, log.batchId, groupedBy]);

  return (
    <Link href={linkHref} className="block mb-4 group">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg p-4 transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-blue-500 hover:bg-bpim-bg hover:shadow-lg hover:shadow-blue-500/10",
          "cursor-pointer",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-1 mb-1 text-slate-500">
              <LuCalendar className="w-3 h-3" />
              <span className="text-[10px] font-medium md:text-xs">
                {dayjs(log.createdAt).tz().format("YYYY/MM/DD HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-white md:text-xl">
                総合BPI {log.totalBpi.toFixed(2)}
              </span>
              <Badge
                className={cn(
                  "px-2 py-0 font-bold border-none",
                  isPositive
                    ? "bg-bpim-primary/10 text-bpim-primary"
                    : "bg-bpim-danger/10 text-bpim-danger",
                )}
              >
                {isPositive ? "+" : ""}
                {log.diff.toFixed(2)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-bpim-bg border border-bpim-border">
            <LuListMusic className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-bold text-white leading-none">
              {log.songCount}
            </span>
            <span className="text-[10px] font-bold text-slate-600 tracking-tighter">
              SONGS
            </span>
          </div>
        </div>

        <Separator className="bg-white/5 mb-3" />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">
            Top Updates
          </span>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {log.topScores.map((score, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-2 rounded-sm bg-bpim-card/50 border border-white/[0.02]"
              >
                <span className="flex-1 text-xs font-bold text-slate-200 truncate leading-tight">
                  {score.title}
                </span>
                <div className="w-[45px] shrink-0 text-right font-mono leading-none">
                  <div className="text-[8px] font-bold text-bpim-text/60 uppercase">
                    BPI
                  </div>
                  <div className="text-xs font-bold text-bpim-primary">
                    {score.bpi.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
