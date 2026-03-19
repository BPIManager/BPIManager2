import { OvertakenRivalInfo } from "@/types/logs/overtaken";
import { BatchDetailItem } from "@/hooks/batches/useBatchDetail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

interface RankItemProps {
  item: BatchDetailItem;
  onClick: () => void;
}

export const OvertakeRankItem = ({ item, onClick }: RankItemProps) => {
  const { current, previous, overtaken = [] } = item;

  const scoreDiff = current.exScore - (previous?.exScore || 0);
  const hasOvertaken = overtaken.length > 0;

  if (!hasOvertaken) return null;

  const isNew = !previous;

  return (
    <div
      onClick={onClick}
      className="w-full p-4 cursor-pointer hover:bg-bpim-overlay/50 transition-colors flex flex-col gap-3 group"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
          <span className="text-sm font-bold text-bpim-text truncate w-full">
            {item.title}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-1 text-[9px] font-bold bg-bpim-overlay/60 text-bpim-muted rounded-sm uppercase">
              {String(item.difficulty || "").slice(0, 1)}
            </span>
            <span className="text-[10px] text-bpim-subtle font-bold font-mono">
              ☆{item.level}
            </span>
            {isNew && (
              <span className="px-1 text-[8px] font-bold bg-purple-600 text-white rounded-sm leading-tight">
                NEW
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-bpim-muted font-mono">
            <span className="font-medium">{previous?.exScore || 0}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-black text-bpim-text text-base">
              {current.exScore}
            </span>
          </div>
          <div className="flex h-6 min-w-[50px] items-center justify-center rounded-sm bg-bpim-primary px-2 text-xs font-bold text-bpim-text">
            +{scoreDiff}
          </div>
        </div>
      </div>

      {hasOvertaken && (
        <div className="flex flex-col gap-2 pl-3 py-2 border-l-2 border-yellow-600/50 bg-yellow-950/10 rounded-r-sm">
          <div className="flex flex-col gap-1">
            {overtaken
              .sort(
                (a, b) =>
                  a.myNewScore - a.rivalScore - (b.myNewScore - b.rivalScore),
              )
              .map((rival: OvertakenRivalInfo) => (
                <div
                  key={rival.rivalUserId}
                  className="flex items-center justify-between pr-2"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 border border-bpim-border">
                      <AvatarImage src={rival.rivalProfileImage ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {rival.rivalName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-bpim-text">
                      {rival.rivalName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-xs text-bpim-muted">
                      {rival.rivalScore}
                    </span>
                    <div className="text-xs font-bold text-yellow-400 min-w-[40px] text-right">
                      <span className="text-[10px] mr-0.5 opacity-80">+</span>
                      {current.exScore - rival.rivalScore}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
