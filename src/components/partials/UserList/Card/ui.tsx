import { TrendingUp, TrendingDown } from "lucide-react";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import dayjs from "@/lib/dayjs";
import { RadarSectionChart } from "../../DashBoard/Radar/ui";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const UserRecommendationCard = ({
  user,
  viewerRadar,
  viewerTotalBpi,
  currentSort = "totalBpi",
  onClick,
}: {
  user: any;
  viewerRadar: any;
  viewerTotalBpi: number;
  currentSort?: string;
  onClick: () => void;
}) => {
  const timeAgo = user.updatedAt ? dayjs(user.updatedAt).fromNow() : "-";
  const isTotalBpi = currentSort === "totalBpi";
  const displayLabel = isTotalBpi
    ? "TOTAL BPI"
    : `${currentSort.toUpperCase()} BPI`;

  const displayValue = isTotalBpi
    ? user.totalBpi
    : (user.radar[currentSort.toUpperCase()] ?? -15);

  const viewerCompareValue = isTotalBpi
    ? viewerTotalBpi
    : (viewerRadar[currentSort.toUpperCase()]?.totalBpi ?? -15);

  const diff = displayValue - viewerCompareValue;
  const isTarget = diff > 0;

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-row items-stretch justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-slate-800/90 md:gap-6 md:p-5"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80"
        style={{ backgroundColor: getBpiColorStyle(user.totalBpi).bg }}
      />

      <div className="flex flex-1 flex-col gap-2 py-1 min-w-0 md:gap-4">
        <div className="flex w-full items-center gap-2 md:gap-3">
          <Avatar className="h-8 w-8 border-2 border-white/10 md:h-12 md:w-12">
            <AvatarImage src={user.profileImage ?? ""} />
            <AvatarFallback>{user.userName.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-0 min-w-0">
            <span className="truncate text-xs font-bold text-white tracking-tight md:text-base">
              {user.userName}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="bg-orange-600 h-4 px-1.5 text-[10px] md:text-[11px] font-bold text-white">
                {user.arenaRank || "N/A"}
              </Badge>
              <span className="font-mono text-[10px] text-slate-500 md:text-[12px]">
                ID: {formatIIDXId(user.iidxId)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 md:text-[12px]">
              最終更新: {timeAgo}
            </span>
          </div>
        </div>

        <div>
          <span
            className={cn(
              "block text-[9px] font-bold tracking-wider mb-0.5",
              isTotalBpi ? "text-slate-500" : "text-blue-400",
            )}
          >
            {displayLabel}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-white md:text-2xl leading-none">
              {displayValue.toFixed(2)}
            </span>
            <div
              className={cn(
                "flex items-center gap-0.5 pb-0.5",
                isTarget ? "text-orange-400" : "text-blue-400",
              )}
            >
              {isTarget ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              <span className="font-mono text-[10px] font-bold md:text-[12px]">
                {isTarget ? "+" : ""}
                {diff.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full">
          <span className="block text-[9px] font-bold tracking-wider text-slate-500 mb-0.5">
            COMMENT
          </span>
          <p className="line-clamp-1 text-[10px] leading-relaxed text-slate-400 md:line-clamp-2 md:text-[11px]">
            {user.profileText || "-"}
          </p>
        </div>
      </div>

      <div className="flex h-[100px] w-[100px] shrink-0 self-center items-center justify-center rounded-xl border border-white/5 bg-black/40 p-1 sm:h-[120px] sm:w-[120px] md:h-[140px] md:w-[140px]">
        <RadarSectionChart
          data={viewerRadar}
          rivalData={user.radar}
          isMini={true}
        />
      </div>
    </button>
  );
};
