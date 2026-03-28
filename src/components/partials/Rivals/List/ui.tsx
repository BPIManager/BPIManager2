import { formatIIDXId } from "@/utils/common/formatIidxId";
import { RadarSectionChart } from "../../DashBoard/Radar";
import { RivalSummaryResult } from "@/types/social/rival";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const RivalSummaryCard = ({
  rival,
  onClick,
}: {
  rival: RivalSummaryResult;
  onClick: () => void;
}) => {
  const {
    stats,
    radar,
    viewerRadar,
    totalBpi,
    userName,
    profileImage,
    arenaRank,
    iidxId,
  } = rival;

  const winRate =
    stats.totalCount > 0 ? (stats.win / stats.totalCount) * 100 : 0;
  const loseRate =
    stats.totalCount > 0 ? (stats.lose / stats.totalCount) * 100 : 0;
  const drawRate =
    stats.totalCount > 0 ? (stats.draw / stats.totalCount) * 100 : 0;
  const bpiStyle = getBpiColorStyle(totalBpi ?? -15);

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-row items-stretch justify-between gap-3 overflow-hidden rounded-2xl border border-bpim-border bg-bpim-bg/80 p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-bpim-border hover:bg-bpim-surface-2/90 md:gap-6 md:p-5"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80 transition-transform group-hover:scale-y-110"
        style={{ backgroundColor: bpiStyle.bg }}
      />

      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="flex w-full items-center gap-3">
          <Avatar className="h-8 w-8 border border-bpim-border md:h-12 md:w-12">
            <AvatarImage src={profileImage ?? ""} />
            <AvatarFallback>{userName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col min-w-0">
            <span className="truncate text-sm font-bold text-bpim-text md:text-base tracking-tight">
              {userName}
            </span>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600 h-4 px-1.5 text-[10px] font-bold border-none">
                {arenaRank || "N/A"}
              </Badge>
              <span className="font-mono text-[10px] text-bpim-muted">
                {formatIIDXId(iidxId || "")}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <span className="block text-[9px] font-bold tracking-widest text-bpim-muted uppercase">
              Total BPI
            </span>
            <span className="font-mono text-base font-bold md:text-xl text-bpim-text">
              {totalBpi?.toFixed(2) ?? "-15.00"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-bold tracking-tight">
            <span className="text-bpim-primary">WIN: {stats.win}</span>
            <span className="text-bpim-muted uppercase">
              LOSE: {stats.lose}
            </span>
          </div>

          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bpim-surface-2/60">
            <div
              className="h-full bg-bpim-primary transition-all duration-500"
              style={{ width: `${winRate}%` }}
            />
            <div
              className="h-full bg-bpim-overlay transition-all duration-500"
              style={{ width: `${drawRate}%` }}
            />
            <div
              className="h-full bg-bpim-danger transition-all duration-500"
              style={{ width: `${loseRate}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-medium text-bpim-muted">
            <span>{winRate.toFixed(1)}% Win</span>
            <span>{stats.totalCount} Songs</span>
          </div>
        </div>
      </div>

      <div className="flex h-[90px] w-[90px] shrink-0 self-center items-center justify-center rounded-xl border border-bpim-border bg-bpim-bg/40 p-1 sm:h-[110px] sm:w-[110px] md:h-[130px] md:w-[130px]">
        <RadarSectionChart data={viewerRadar} rivalData={radar} isMini={true} />
      </div>
    </button>
  );
};
