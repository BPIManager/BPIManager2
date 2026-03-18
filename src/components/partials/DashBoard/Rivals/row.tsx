import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface RivalComparisonRowProps {
  rival: {
    userId: string;
    userName: string;
    profileImage?: string | null;
    stats: {
      win: number;
      lose: number;
      draw: number;
      totalCount: number;
    };
  };
}

export const RivalComparisonRow = ({ rival }: RivalComparisonRowProps) => {
  const { userName, profileImage, userId } = rival;
  const { win, lose, draw, totalCount } = rival.stats;

  const winRate = totalCount > 0 ? (win / totalCount) * 100 : 0;
  const drawRate = totalCount > 0 ? (draw / totalCount) * 100 : 0;
  const loseRate = totalCount > 0 ? (lose / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-5 w-5">
            <AvatarImage src={profileImage} alt={userName} />
            <AvatarFallback className="text-[8px]">
              {userName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/rivals/${userId}`}
            className="truncate text-xs font-bold text-bpim-text transition-colors hover:text-bpim-primary"
          >
            {userName}
          </Link>
        </div>
        <span className="text-[10px] font-bold text-bpim-muted whitespace-nowrap">
          {totalCount}曲
        </span>
      </div>

      <div className="relative h-[18px] w-full overflow-hidden rounded-sm bg-bpim-surface-2/60">
        <div className="flex h-full w-full items-center gap-0">
          <div
            className="relative h-full bg-bpim-primary transition-all duration-1000 ease-out"
            style={{ width: `${winRate}%` }}
          >
            {winRate > 10 && (
              <div className="flex h-full items-center justify-center">
                <span className="text-[10px] font-bold text-bpim-text">
                  {win}
                </span>
              </div>
            )}
          </div>

          <div
            className="relative h-full bg-bpim-overlay transition-all duration-1000 ease-out"
            style={{ width: `${drawRate}%` }}
          >
            {drawRate > 15 && (
              <div className="flex h-full items-center justify-center">
                <span className="text-[10px] font-bold text-bpim-text">
                  {draw}
                </span>
              </div>
            )}
          </div>

          <div
            className="relative h-full bg-bpim-danger transition-all duration-1000 ease-out"
            style={{ width: `${loseRate}%` }}
          >
            {loseRate > 10 && (
              <div className="flex h-full items-center justify-center">
                <span className="text-[10px] font-bold text-bpim-text">
                  {lose}
                </span>
              </div>
            )}
          </div>
        </div>

        {winRate <= 10 && win > 0 && (
          <span className="pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-yellow-400">
            {win}
          </span>
        )}
        {loseRate <= 10 && lose > 0 && (
          <span className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-bpim-primary">
            {lose}
          </span>
        )}
      </div>
    </div>
  );
};
