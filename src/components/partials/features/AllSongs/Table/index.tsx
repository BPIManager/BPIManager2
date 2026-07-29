"use client";

import { cn } from "@/lib/utils";
import { getLampClass, diffColors } from "@/components/partials/Table/ui";
import dayjs from "@/lib/dayjs";
import { AllSongWithScore } from "@/types/songs/allSongs";

const diffShort: Record<string, string> = {
  BEGINNER: "B",
  NORMAL: "N",
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};
const diffColorAll: Record<string, string> = {
  ...diffColors,
  BEGINNER: "bg-green-800",
  NORMAL: "bg-blue-800",
};

export const AllSongItem = ({
  song,
  onClick,
}: {
  song: AllSongWithScore;
  onClick: () => void;
}) => {
  const lampClass = getLampClass(song.clearState);
  const rate =
    song.exScore !== null
      ? ((song.exScore / (song.notes * 2)) * 100).toFixed(1)
      : null;

  return (
    <div
      onClick={onClick}
      className="relative w-full mb-2 cursor-pointer overflow-hidden rounded-sm bg-bpim-surface hover:bg-bpim-overlay transition-colors duration-200"
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
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-[18px] flex items-center justify-center rounded-sm",
                  diffColorAll[song.difficulty] || "bg-bpim-surface-2",
                )}
              >
                <span className="text-[11px] font-bold text-white leading-none">
                  {song.difficultyLevel}
                </span>
              </div>
              <span className="text-xs font-bold text-bpim-muted">
                {diffShort[song.difficulty]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-bpim-bg/30 p-2 lg:p-4 shrink-0">
          <div className="flex items-end gap-3 font-mono">
            <div className="flex flex-col items-end min-w-[48px]">
              <span className="text-[10px] text-bpim-muted leading-none mb-0.5 uppercase">
                EX
              </span>
              <span className="text-sm font-bold text-bpim-text leading-none">
                {song.exScore !== null ? song.exScore : "---"}
              </span>
            </div>
            <div className="flex flex-col items-end min-w-[40px]">
              <span className="text-[10px] text-bpim-muted leading-none mb-0.5 uppercase">
                Rate
              </span>
              <span
                className={cn(
                  "text-sm font-bold leading-none",
                  song.missCount === 0
                    ? "text-bpim-success"
                    : song.missCount !== null
                      ? "text-bpim-danger"
                      : "text-bpim-subtle",
                )}
              >
                <span className="text-sm font-bold text-bpim-text leading-none">
                  {rate}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AllSongList = ({
  songs,
  onSongSelect,
}: {
  songs: AllSongWithScore[];
  onSongSelect: (s: AllSongWithScore) => void;
}) => (
  <div className="w-full p-2 flex flex-col">
    {songs.map((song) => (
      <AllSongItem
        key={`${song.songId}-${song.difficulty}`}
        song={song}
        onClick={() => onSongSelect(song)}
      />
    ))}
  </div>
);
