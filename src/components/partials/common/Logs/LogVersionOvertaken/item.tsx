import type { BatchDetailItem } from "@/types/logs/batchDetail";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankItemProps {
  item: BatchDetailItem;
  /** true: 勝敗・追い抜き済みかに関わらず全差分を表示。false: このバッチで新たに追い抜いたものだけ表示 */
  showAllDiffs: boolean;
  onClick: () => void;
}

const VersionOvertakeRankItem = ({
  item,
  showAllDiffs,
  onClick,
}: RankItemProps) => {
  const { current, previous, versionOvertaken = [] } = item;

  const scoreDiff = current.exScore - (previous?.exScore || 0);
  const rows = showAllDiffs
    ? versionOvertaken
    : versionOvertaken.filter((v) => v.isNewOvertake);

  if (rows.length === 0) return null;

  const isNew = !previous;
  const sortedRows = rows
    .slice()
    .sort((a, b) => Number(a.targetVersion) - Number(b.targetVersion));

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

        <div className="grid grid-cols-2 items-center gap-x-4 gap-y-0.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-bpim-muted font-mono justify-end">
            <span className="font-medium">{previous?.exScore || 0}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-black text-bpim-text text-base">
              {current.exScore}
            </span>
          </div>
          <div className="flex min-w-12.5 items-center justify-center rounded-sm bg-bpim-primary px-2 text-xs font-bold text-bpim-text">
            +{scoreDiff}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 pl-3 py-2 border-l-2 border-yellow-600/50 bg-yellow-950/10 rounded-r-sm">
        {sortedRows.map((v) => (
          <div
            key={v.targetVersion}
            className="flex items-center justify-between pr-2"
          >
            <span className="text-xs font-medium text-bpim-text">
              {v.targetVersionLabel}
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-xs text-bpim-muted">{v.targetScore}</span>
              <div
                className={cn(
                  "text-xs font-bold min-w-10 text-right",
                  v.diff > 0
                    ? "text-yellow-400"
                    : v.diff < 0
                      ? "text-bpim-danger"
                      : "text-bpim-muted",
                )}
              >
                {v.diff > 0 && (
                  <span className="text-[10px] mr-0.5 opacity-80">+</span>
                )}
                {v.diff}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionOvertakeRankItem;
