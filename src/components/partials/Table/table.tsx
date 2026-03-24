import { SongWithScore } from "@/types/songs/withScore";
import { getDJRank } from "@/utils/songs/djRank";
import { RefObject } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const diffColors: Record<string, string> = {
  ANOTHER: "bg-red-900",
  LEGGENDARIA: "bg-purple-900",
  HYPER: "bg-yellow-700",
};

export const getLampClass = (clearState: string | null | undefined) => {
  if (!clearState || clearState === "NO PLAY") return "bg-bpim-overlay";
  switch (clearState) {
    case "FAILED":
      return "bg-bpim-subtle";
    case "ASSIST CLEAR":
      return "bg-purple-500";
    case "EASY CLEAR":
      return "bg-green-500";
    case "CLEAR":
      return "bg-bpim-primary";
    case "HARD CLEAR":
      return "bg-bpim-danger";
    case "EX HARD CLEAR":
      return "bg-yellow-500";
    case "FULLCOMBO CLEAR":
      return "bg-gradient-to-b from-white to-yellow-400";
    default:
      return "bg-bpim-overlay";
  }
};

const DiffBadge = ({
  diff,
  unit = "",
}: {
  diff: number | undefined;
  unit?: string;
}) => {
  if (diff === undefined || diff === null) return null;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-400 mt-0.5">
        <TrendingUp className="h-2.5 w-2.5" />+
        {unit === "bpi" ? diff.toFixed(2) : diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400 mt-0.5">
        <TrendingDown className="h-2.5 w-2.5" />
        {unit === "bpi" ? diff.toFixed(2) : diff}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-bpim-muted mt-0.5">
      <Minus className="h-2.5 w-2.5" />0
    </span>
  );
};

const SongItem = ({
  song,
  compareVersion,
  onClick,
}: {
  song: SongWithScore;
  compareVersion?: string;
  onClick: () => void;
}) => {
  const lampClass = getLampClass(song.clearState);
  const showCompare =
    compareVersion &&
    compareVersion !== "none" &&
    song.rival !== undefined &&
    song.rival !== null;

  const prevEx = showCompare ? song.rival?.exScore : null;
  const prevBpi = showCompare ? song.rival?.bpi : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full mb-2 cursor-pointer transition-colors duration-200 overflow-hidden rounded-sm",
        "bg-bpim-surface hover:bg-bpim-overlay",
      )}
    >
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1 z-10", lampClass)}
      />

      <div className="grid grid-cols-[1fr_auto]">
        <div className="flex items-center pl-4 pr-3 py-2 min-w-0">
          <div className="flex flex-col gap-0.5 w-full">
            <h3 className="text-sm font-bold text-bpim-text truncate leading-tight">
              {song.title}
            </h3>

            <div className="grid grid-cols-[32px_12px_70px_70px] gap-2 items-center">
              <div
                className={cn(
                  "w-8 h-[18px] flex items-center justify-center rounded-sm",
                  diffColors[song.difficulty] || "bg-bpim-surface-2",
                )}
              >
                <span className="text-[11px] font-bold text-white leading-none">
                  {song.difficultyLevel}
                </span>
              </div>

              <span className="text-xs font-bold text-bpim-muted text-center leading-none">
                {song.difficulty.charAt(0)}
              </span>

              {song.exScore !== null && (
                <>
                  {(["current", "next"] as const).map((mode) => (
                    <span
                      key={mode}
                      className="text-[10px] text-bpim-text whitespace-nowrap leading-none font-mono"
                    >
                      {getDJRank(Number(song.exScore), song.notes * 2, {
                        mode,
                        output: "label",
                      })}
                      <span className="ml-0.5 text-bpim-muted">
                        {getDJRank(Number(song.exScore), song.notes * 2, {
                          mode,
                          output: "value",
                        })}
                      </span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center bg-bpim-bg/30 p-2 lg:p-4 shrink-0">
          <div className="flex items-end gap-3 font-mono">
            <div className="flex flex-col items-end min-w-[48px]">
              <span className="text-[10px] text-bpim-muted leading-none mb-0.5 uppercase">
                EX
              </span>
              <span className="text-sm lg:text-lg font-bold text-bpim-text leading-none">
                {song.exScore !== null ? song.exScore : "---"}
              </span>
              {showCompare && (
                <div className="flex flex-col items-end">
                  {prevEx !== null && prevEx !== undefined ? (
                    <>
                      <span className="text-[9px] text-bpim-muted leading-none">
                        前:{prevEx}
                      </span>
                      <DiffBadge diff={song.exDiff} />
                    </>
                  ) : (
                    <span className="text-[9px] text-bpim-muted">前:未</span>
                  )}
                </div>
              )}
              {!showCompare && song.exDiff !== undefined && song.exDiff > 0 && (
                <span className="text-[10px] font-bold text-bpim-success mt-0.5">
                  +{song.exDiff}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end min-w-[52px]">
              <span className="text-[10px] text-bpim-muted leading-none mb-0.5 uppercase">
                BPI
              </span>
              <span className="text-sm lg:text-lg font-bold text-bpim-text leading-none">
                {song.bpi !== null ? song.bpi.toFixed(2) : "---"}
              </span>
              {showCompare && (
                <div className="flex flex-col items-end">
                  {prevBpi !== null && prevBpi !== undefined ? (
                    <>
                      <span className="text-[9px] text-bpim-muted leading-none">
                        前:{prevBpi.toFixed(2)}
                      </span>
                      <DiffBadge diff={song.bpiDiff} unit="bpi" />
                    </>
                  ) : (
                    <span className="text-[9px] text-bpim-muted">前:未</span>
                  )}
                </div>
              )}
              {!showCompare &&
                song.bpiDiff !== undefined &&
                song.bpiDiff > 0 && (
                  <span className="text-[10px] font-bold text-bpim-success mt-0.5">
                    +{song.bpiDiff.toFixed(2)}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SongList = ({
  songs,
  compareVersion,
  onSongSelect,
  listRef,
}: {
  songs: SongWithScore[];
  compareVersion?: string;
  onSongSelect: (s: SongWithScore) => void;
  listRef?: RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div className="w-full p-2 flex flex-col" ref={listRef}>
      {songs.map((song) => (
        <SongItem
          key={`${song.songId}-${song.difficulty}`}
          song={song}
          compareVersion={compareVersion}
          onClick={() => onSongSelect(song)}
        />
      ))}
    </div>
  );
};
