import { SongWithScore } from "@/types/songs/withScore";
import { getDJRank } from "@/utils/songs/djRank";
import { RefObject } from "react";
import { cn } from "@/lib/utils";

export const diffColors: Record<string, string> = {
  ANOTHER: "bg-red-900",
  LEGGENDARIA: "bg-purple-900",
  HYPER: "bg-yellow-700",
};

export const getLampClass = (clearState: string | null | undefined) => {
  if (!clearState || clearState === "NO PLAY") return "bg-slate-600";

  switch (clearState) {
    case "FAILED":
      return "bg-slate-300";
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
      return "bg-linear-to-b from-red-500 via-yellow-400 via-green-400 via-blue-400 to-purple-500";
    default:
      return "bg-slate-600";
  }
};

interface SongItemProps {
  song: SongWithScore;
}

const SongItem = ({
  song,
  onClick,
}: {
  song: SongWithScore;
  onClick: () => void;
}) => {
  const lampClass = getLampClass(song.clearState);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full mb-2 cursor-pointer transition-colors duration-200 overflow-hidden",
        "bg-white/10 hover:bg-white/20",
      )}
    >
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1 z-10", lampClass)}
      />

      <div className="grid grid-cols-[1fr_auto] gap-1">
        <div className="flex items-center pl-4 pr-3 py-2 min-w-0">
          <div className="flex flex-col gap-0.5 w-full">
            <h3 className="text-sm font-bold text-white truncate leading-tight">
              {song.title}
            </h3>

            <div className="grid grid-cols-[32px_12px_70px_70px] gap-2 items-center">
              <div
                className={cn(
                  "w-8 h-[18px] flex items-center justify-center rounded-sm",
                  diffColors[song.difficulty] || "bg-slate-800",
                )}
              >
                <span className="text-[11px] font-bold text-white leading-none">
                  {song.difficultyLevel}
                </span>
              </div>

              <span className="text-xs font-bold text-slate-500 text-center leading-none">
                {song.difficulty.charAt(0)}
              </span>

              {song.exScore !== null && (
                <>
                  {(["current", "next"] as const).map((mode) => (
                    <span
                      key={mode}
                      className="text-[10px] text-slate-300 whitespace-nowrap leading-none font-mono"
                    >
                      {getDJRank(Number(song.exScore), song.notes * 2, {
                        mode,
                        output: "label",
                      })}
                      <span className="ml-0.5 text-slate-500">
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
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 leading-none mb-0.5 uppercase">
                EX
              </span>
              <span className="text-sm lg:text-xl font-bold text-slate-200 leading-none">
                {song.exScore !== null ? song.exScore : "---"}
              </span>
              {song.exDiff !== undefined && song.exDiff > 0 && (
                <span className="text-[10px] font-bold text-bpim-success mt-0.5">
                  +{song.exDiff}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 leading-none mb-0.5 uppercase">
                BPI
              </span>
              <span className="text-sm lg:text-xl font-bold text-slate-200 leading-none">
                {song.bpi !== null ? song.bpi.toFixed(2) : "---"}
              </span>
              {song.bpiDiff !== undefined && song.bpiDiff > 0 && (
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
  onSongSelect,
  listRef,
}: {
  songs: SongWithScore[];
  onSongSelect: (s: SongWithScore) => void;
  listRef?: RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div className="w-full p-2 flex flex-col" ref={listRef}>
      {songs.map((song) => (
        <SongItem
          key={`${song.songId}-${song.difficulty}`}
          song={song}
          onClick={() => onSongSelect(song)}
        />
      ))}
    </div>
  );
};
