import { Swords, Crown } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { TimelineEntry } from "@/hooks/social/useTimeline";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { diffColors } from "../../Table/table";

export const TimelineItem = ({ entry }: { entry: TimelineEntry }) => {
  const { opponentScore: opp, viewerScore: viewer, isOvertaken } = entry;

  const hasViewerScore = !!viewer;

  const vsEx = hasViewerScore ? viewer.exScore - opp.currentEx : 0;
  const vsBpi = hasViewerScore ? viewer.bpi - opp.currentBpi : 0;

  const isCurrentlyWinning = hasViewerScore && vsEx >= 0;
  const isCurrentlyLosing = hasViewerScore && vsEx < 0;

  return (
    <div
      className={cn(
        "p-3 border-b transition-all duration-200",
        isOvertaken
          ? "bg-bpim-danger/10 border-red-900/50"
          : isCurrentlyLosing
            ? "bg-bpim-danger/5 border-red-900/30"
            : isCurrentlyWinning
              ? "bg-green-500/5 border-green-900/30"
              : "bg-bpim-bg/60 border-bpim-border",
      )}
    >
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div>
          <Link href={`/rivals/${entry.userId}`}>
            <Avatar className="h-8 w-8 border border-bpim-border">
              <AvatarImage src={entry.profileImage ?? ""} />
              <AvatarFallback>{entry.userName.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/rivals/${entry.userId}`}
                  className="font-bold text-white hover:underline truncate max-w-[120px]"
                >
                  {entry.userName}
                </Link>

                {isCurrentlyLosing && (
                  <Badge
                    variant="destructive"
                    className="h-4 px-1.5 text-[9px] rounded-full gap-1"
                  >
                    <Swords className="h-2.5 w-2.5" /> 敗北
                  </Badge>
                )}
                {isCurrentlyWinning && (
                  <Badge className="h-4 px-1.5 text-[9px] rounded-full gap-1 bg-green-600 hover:bg-green-600 text-white border-none">
                    <Crown className="h-2.5 w-2.5" /> 勝利
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-slate-500">
                {dayjs(entry.lastPlayed).fromNow()}
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-md border border-bpim-border bg-bpim-bg/40 p-2">
              <div className="flex items-center justify-between">
                <span className="truncate text-xs font-bold text-white">
                  {entry.title}
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-white uppercase",
                    diffColors[entry.difficulty] || "bg-slate-700",
                  )}
                >
                  {entry.difficulty}
                </span>
              </div>

              <ComparisonRow
                label="BPI"
                oppValue={opp.currentBpi}
                oppGrowth={opp.diffBpi}
                viewerValue={viewer?.bpi}
                diff={vsBpi}
                color="text-bpim-warning"
                isFloat
              />

              <ComparisonRow
                label="EX"
                oppValue={opp.currentEx}
                oppGrowth={opp.diffEx}
                viewerValue={viewer?.exScore}
                diff={vsEx}
                color="text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonRow = ({
  label,
  oppValue,
  oppGrowth,
  viewerValue,
  diff,
  color,
  isFloat = false,
}: any) => {
  const format = (v: number) => (isFloat ? v.toFixed(2) : v);
  const hasViewer = viewerValue !== undefined;

  return (
    <div className="grid grid-cols-[28px_1.5fr_1fr_1fr_1.2fr] gap-1 items-center w-full font-mono">
      <span className="text-[9px] font-bold text-slate-500">{label}</span>

      <span className={cn("text-[11px] font-bold text-right", color)}>
        {format(oppValue)}
      </span>

      <div className="flex justify-end text-bpim-success">
        {oppGrowth && oppGrowth > 0 ? (
          <span className="text-[9px] font-bold">+{format(oppGrowth)}</span>
        ) : (
          <span className="text-[9px] opacity-20">-</span>
        )}
      </div>

      <span
        className={cn(
          "text-[11px] font-bold text-right",
          hasViewer ? "text-slate-400" : "text-slate-800",
        )}
      >
        {hasViewer ? format(viewerValue) : "---"}
      </span>

      <div className="flex justify-end">
        {hasViewer ? (
          <span
            className={cn(
              "inline-flex items-center justify-center h-3.5 min-w-[38px] px-1 rounded-sm text-[10px] font-bold border",
              diff >= 0
                ? "border-green-900 text-bpim-success bg-green-500/5"
                : "border-red-900 text-bpim-danger bg-bpim-danger/5",
            )}
          >
            {diff >= 0 ? "+" : ""}
            {format(diff)}
          </span>
        ) : (
          <div className="w-[38px]" />
        )}
      </div>
    </div>
  );
};
