"use client";

import { SongWithRival } from "@/types/songs/withScore";
import { cn } from "@/lib/utils";
import { getLampClass } from "../../Table/table";

const f = (val: number | null | undefined, p?: number) => {
  if (val === null || val === undefined || !Number.isFinite(val)) return "---";
  return p !== undefined ? val.toFixed(p) : val.toString();
};

const diffColors: Record<string, string> = {
  ANOTHER: "bg-red-900",
  LEGGENDARIA: "bg-purple-900",
  HYPER: "bg-yellow-700",
};

const SongInfo = ({ song }: { song: SongWithRival }) => (
  <div className="flex flex-col items-start gap-1 min-w-0 w-full">
    <h3 className="text-sm font-bold text-white truncate leading-tight">
      {song.title}
    </h3>
    <div className="flex items-center gap-2">
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
      <span className="text-xs font-bold text-slate-500 leading-none">
        {song.difficulty.charAt(0)}
      </span>
    </div>
  </div>
);

const DiffBox = ({ exDiff, bpiDiff, isMobile }: any) => {
  const hasDiff = exDiff !== null && Number.isFinite(exDiff);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-0 transition-opacity",
        !hasDiff && "opacity-10",
      )}
    >
      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
        DIFF
      </span>
      <span
        className={cn(
          "font-bold leading-none",
          isMobile ? "text-[11px]" : "text-xs",
          exDiff > 0
            ? "text-bpim-success"
            : exDiff < 0
              ? "text-bpim-danger"
              : "text-slate-500",
        )}
      >
        {exDiff > 0 ? `+${exDiff}` : (exDiff ?? "---")}
      </span>
      <span
        className={cn(
          "text-[10px] font-bold leading-none mt-0.5",
          bpiDiff > 0
            ? "text-green-300"
            : bpiDiff < 0
              ? "text-red-300"
              : "text-slate-600",
        )}
      >
        {bpiDiff > 0
          ? `+${bpiDiff.toFixed(2)}`
          : (bpiDiff?.toFixed(2) ?? "---")}
      </span>
    </div>
  );
};

const ScoreBox = ({ label, ex, bpi, clearState, colorClass, isRival }: any) => {
  const lampClass = getLampClass(clearState);
  return (
    <div
      className={cn(
        "relative flex flex-col justify-center px-5",
        isRival ? "bg-bpim-bg/40 items-start" : "items-end",
      )}
    >
      <div
        className={cn(
          "absolute top-0 bottom-0 w-[3px]",
          isRival ? "left-0" : "right-0",
          lampClass,
        )}
      />

      <span className={cn("text-[9px] font-bold mb-1", colorClass)}>
        {label}
      </span>
      <div className="flex items-baseline gap-4 font-mono">
        <div
          className={cn("flex flex-col", isRival ? "items-start" : "items-end")}
        >
          <span className="text-[8px] text-slate-500 uppercase">EX</span>
          <span className="text-sm font-bold text-white leading-none">
            {f(ex)}
          </span>
        </div>
        <div
          className={cn("flex flex-col", isRival ? "items-start" : "items-end")}
        >
          <span className="text-[8px] text-slate-500 uppercase">BPI</span>
          <span className="text-sm font-bold text-white leading-none">
            {f(bpi, 2)}
          </span>
        </div>
      </div>
    </div>
  );
};

const MobileScoreView = ({ label, ex, bpi, clearState, align }: any) => {
  const lampClass = getLampClass(clearState);
  return (
    <div
      className={cn(
        "flex flex-col gap-1 flex-1 min-w-0",
        align === "end" ? "items-end" : "items-start",
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn("w-[3px] h-2.5 rounded-full", lampClass)} />
        <span
          className={cn(
            "text-[10px] font-bold",
            label === "YOU" ? "text-bpim-primary" : "text-bpim-warning",
          )}
        >
          {label}
        </span>
      </div>
      <div
        className={cn(
          "flex flex-col",
          align === "end" ? "items-end" : "items-start",
        )}
      >
        <span className="text-sm font-bold text-white leading-none font-mono">
          {f(ex)}
        </span>
        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
          {f(bpi, 1)}
        </span>
      </div>
    </div>
  );
};

export const RivalSongItem = ({
  song,
  onClick,
}: {
  song: SongWithRival;
  onClick: () => void;
}) => {
  const { exDiff, bpiDiff } = song;

  return (
    <div
      onClick={onClick}
      className="group relative w-full cursor-pointer border-b border-bpim-border bg-white/[0.02] transition-colors hover:bg-white/5"
    >
      <div className="hidden lg:grid h-[68px] grid-cols-[1fr_140px_100px_140px] items-stretch">
        <div className="flex items-center px-4 min-w-0">
          <SongInfo song={song} />
        </div>
        <ScoreBox
          label="YOU"
          ex={song.exScore}
          bpi={song.bpi}
          clearState={song.clearState}
          colorClass="text-bpim-primary"
        />
        <DiffBox exDiff={exDiff} bpiDiff={bpiDiff} />
        <ScoreBox
          label="RIVAL"
          ex={song.rival?.exScore}
          bpi={song.rival?.bpi}
          clearState={song.rival?.clearState}
          colorClass="text-bpim-warning"
          isRival
        />
      </div>

      <div className="flex flex-col gap-0 py-4 px-3 lg:hidden">
        <div className="mb-3">
          <SongInfo song={song} />
        </div>
        <div className="grid grid-cols-[1fr_80px_1fr] items-center gap-2">
          <MobileScoreView
            label="YOU"
            ex={song.exScore}
            bpi={song.bpi}
            clearState={song.clearState}
            align="start"
          />
          <DiffBox exDiff={exDiff} bpiDiff={bpiDiff} isMobile />
          <MobileScoreView
            label="RIVAL"
            ex={song.rival?.exScore}
            bpi={song.rival?.bpi}
            clearState={song.rival?.clearState}
            align="end"
          />
        </div>
      </div>
    </div>
  );
};
