
import { ArrowLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MiniBpiChip } from "@/components/partials/common/OptimizerGoalCard";

import DifficultyBadge from "../../DifficultyBadge";
import { type SongSearchResult } from "@/hooks/songs/useSongSearch";
import { useTranslation } from "@/hooks/common/useTranslation";

import { quickScoreOptions, bpiQuickOptions, scoreRate } from "@/components/partials/features/Analytics/BpiOptimizer/ui/CustomGoal/SongTargetModal/quickOptions";

export interface SongEditStepProps {
  selectedSong: SongSearchResult;
  setSelectedSong: (value: SongSearchResult | null) => void;
  exScoreInput: string;
  setExScoreInput: (value: string) => void;
  currentExScore: number | null;
  maxScore: number | null;
  enteredRate: number | null;
  enteredBpi: number | null;
  diffFromCurrent: number | null;
  rankDetailText: string | null;
  t: ReturnType<typeof useTranslation>["t"];
  tFormat: ReturnType<typeof useTranslation>["tFormat"];
}

/** 選んだ曲の EX スコアを入力し、BPI・ランク差分を確認する段階。 */
export const SongEditStep = ({
  selectedSong,
  setSelectedSong,
  exScoreInput,
  setExScoreInput,
  currentExScore,
  maxScore,
  enteredRate,
  enteredBpi,
  diffFromCurrent,
  rankDetailText,
  t,
  tFormat,
}: SongEditStepProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <button
        onClick={() => setSelectedSong(null)}
        className="flex items-center gap-1 self-start text-xs text-bpim-muted hover:text-bpim-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("optimizer.customGoal.changeSong")}
      </button>

      <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-bpim-border bg-bpim-surface p-3">
        <div className="flex min-w-0 items-center gap-2">
          <DifficultyBadge difficulty={selectedSong.difficulty} />
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-bpim-text">
            {selectedSong.title}
          </span>
        </div>
        <span className="text-xs text-bpim-muted">
          {currentExScore != null
            ? tFormat("optimizer.customGoal.currentScore", {
                score: currentExScore,
                rate: scoreRate(
                  currentExScore,
                  selectedSong.notes,
                ).toFixed(2),
              })
            : t("optimizer.customGoal.unplayed")}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <label className="text-xs font-bold text-bpim-muted">
            {t("optimizer.customGoal.targetExScore")}
          </label>
          <div className="flex items-center gap-1.5">
            {rankDetailText && (
              <span className="font-mono text-xs font-bold text-bpim-primary">
                {rankDetailText}
              </span>
            )}
            {enteredBpi != null && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-bpim-subtle">
                BPI
                <MiniBpiChip bpi={enteredBpi} />
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bpim-muted/15">
            <div
              className="h-full rounded-full bg-bpim-primary transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, enteredRate ?? 0))}%`,
              }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-xs font-bold text-bpim-muted">
            {enteredRate != null ? `${enteredRate.toFixed(2)}%` : "-"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={maxScore ?? undefined}
            value={exScoreInput}
            onChange={(e) => setExScoreInput(e.target.value)}
            className="h-9 font-mono"
          />
          <span className="shrink-0 font-mono text-xs text-bpim-muted">
            MAX {maxScore}
          </span>
          {diffFromCurrent != null && (
            <span className="flex shrink-0 items-center gap-1 text-xs">
              <span className="text-[10px] font-bold text-bpim-subtle">
                {t("optimizer.customGoal.diffFromCurrent")}
              </span>
              <span
                className={cn(
                  "font-mono font-bold",
                  diffFromCurrent > 0
                    ? "text-bpim-primary"
                    : diffFromCurrent < 0
                      ? "text-bpim-danger"
                      : "text-bpim-muted",
                )}
              >
                {diffFromCurrent > 0 ? "+" : ""}
                {diffFromCurrent}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickScoreOptions(selectedSong).map((opt) => (
            <Button
              key={opt.label}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto flex-col gap-0 px-2 py-1"
              onClick={() => setExScoreInput(String(opt.score))}
            >
              <span className="text-xs font-bold">{opt.label}</span>
              <span className="font-mono text-[10px] text-bpim-muted">
                {opt.score}
              </span>
              {opt.bpi != null && (
                <span className="font-mono text-[10px] text-bpim-primary">
                  BPI {opt.bpi.toFixed(1)}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {bpiQuickOptions(selectedSong).map((opt) => (
            <Button
              key={opt.bpi}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto flex-col gap-0 px-2 py-1"
              onClick={() => setExScoreInput(String(opt.score))}
            >
              <span className="text-xs font-bold">BPI {opt.bpi}</span>
              <span className="font-mono text-[10px] text-bpim-muted">
                {opt.score}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
