import { diffColors } from "@/components/partials/Table/table";
import { NearLoseSongItem } from "@/hooks/stats/useRivalNearLose";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NearLoseRankItemProps {
  item: NearLoseSongItem;
  rank: number;
  onClick: () => void;
}

export const NearLoseRankItem = ({
  item,
  rank,
  onClick,
}: NearLoseRankItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between gap-3 border-b border-white/10 p-3 pl-4 transition-colors",
        "cursor-pointer hover:bg-white/5",
        "before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-1 before:bg-orange-400 before:content-['']",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-8 w-8 rounded-full bg-gray-700">
          <AvatarImage
            src={String(item.rival.profileImage || "")}
            alt={item.rival.userName}
          />
          <AvatarFallback className="text-[10px]">
            {item.rival.userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-col gap-0">
          <span className="truncate text-sm font-bold text-white">
            {item.title}
          </span>
          <div className="flex items-center gap-1">
            <span
              className="flex h-[14px] items-center rounded-sm px-2 text-[9px] font-bold text-white uppercase"
              style={{
                backgroundColor: diffColors[item.difficulty] || "#1f2937",
              }}
            >
              {String(item.difficulty).charAt(0)}
            </span>
            <span className="text-xs text-gray-500">{item.rival.userName}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-4 font-mono">
        <div className="flex flex-col items-end gap-0">
          <span className="text-[12px] leading-none text-gray-400">My EX</span>
          <span className="text-sm font-bold text-gray-200">
            {item.exScore}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0">
          <span className="text-[12px] font-bold leading-none text-orange-500">
            あと
          </span>
          <span className="text-sm font-bold text-orange-300">
            {item.exDiff}点
          </span>
        </div>
      </div>
    </div>
  );
};
