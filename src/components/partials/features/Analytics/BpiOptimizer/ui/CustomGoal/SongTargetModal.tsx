import { useEffect, useState } from "react";
import { Search, CircleDashed, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import { useSongSearch, type SongSearchResult } from "@/hooks/songs/useSongSearch";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface CustomGoalTargetInput {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  toExScore: number;
}

const QUICK_SCORE_LABELS = ["A", "AA", "AAA", "MAX-"] as const;

function quickScoreOptions(notes: number): { label: string; score: number }[] {
  const maxScore = notes * 2;
  const ratioByLabel = new Map(RANK_TABLE.map((r) => [r.label, r.ratio]));
  const options: { label: string; score: number }[] = QUICK_SCORE_LABELS.map(
    (label) => ({
      label,
      score: Math.ceil(maxScore * (ratioByLabel.get(label) ?? 0)),
    }),
  );
  options.push({ label: "MAX", score: maxScore });
  return options;
}

const SongTargetModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialTarget,
  difficultyLevel = 12,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (target: CustomGoalTargetInput) => void;
  initialTarget?: CustomGoalTargetInput;
  difficultyLevel?: number;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<SongSearchResult | null>(
    null,
  );
  const [exScoreInput, setExScoreInput] = useState("");

  // モーダルを開くたびに前回の入力を消し、初期値(編集時)で作り直す
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    if (initialTarget) {
      setSelectedSong({
        songId: initialTarget.songId,
        title: initialTarget.title,
        difficulty: initialTarget.difficulty,
        difficultyLevel: initialTarget.difficultyLevel,
        notes: initialTarget.notes,
        bpm: null,
        releasedVersion: null,
      });
      setExScoreInput(String(initialTarget.toExScore));
    } else {
      setSelectedSong(null);
      setExScoreInput("");
    }
    setQuery("");
    setDebouncedQuery("");
  }, [isOpen, initialTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { songs, isLoading } = useSongSearch(debouncedQuery, {
    difficultyLevel,
  });

  const maxScore = selectedSong ? selectedSong.notes * 2 : null;
  const exScoreNum = parseInt(exScoreInput, 10);
  const isExScoreValid =
    !isNaN(exScoreNum) &&
    exScoreNum >= 0 &&
    (maxScore == null || exScoreNum <= maxScore);

  const handleConfirm = () => {
    if (!selectedSong || !isExScoreValid) return;
    onConfirm({
      songId: selectedSong.songId,
      title: selectedSong.title,
      difficulty: selectedSong.difficulty,
      difficultyLevel: selectedSong.difficultyLevel,
      notes: selectedSong.notes,
      toExScore: exScoreNum,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-md border-bpim-border bg-bpim-bg">
        <DialogHeader>
          <DialogTitle>
            {selectedSong
              ? t("optimizer.customGoal.scoreStepTitle")
              : t("optimizer.customGoal.searchStepTitle")}
          </DialogTitle>
        </DialogHeader>

        {!selectedSong ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("optimizer.customGoal.searchPlaceholder")}
                className="pl-8 h-9"
              />
            </div>
            <div className="flex max-h-72 flex-col gap-1 overflow-y-auto custom-scrollbar">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <CircleDashed className="h-4 w-4 animate-spin text-bpim-muted" />
                </div>
              )}
              {!isLoading && debouncedQuery && songs.length === 0 && (
                <p className="py-8 text-center text-xs text-bpim-subtle">
                  {t("optimizer.customGoal.noResults")}
                </p>
              )}
              {songs.map((song) => (
                <button
                  key={`${song.songId}`}
                  onClick={() => setSelectedSong(song)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-bpim-overlay/50 transition-colors"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded px-1 py-0.5 text-[10px] font-black text-white",
                      DIFF_COLORS[song.difficulty],
                    )}
                  >
                    {song.difficultyLevel}
                    {song.difficulty.charAt(0)}
                  </span>
                  <span className="truncate text-sm text-bpim-text">
                    {song.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setSelectedSong(null)}
              className="flex items-center gap-1 self-start text-xs text-bpim-muted hover:text-bpim-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("optimizer.customGoal.changeSong")}
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface p-3">
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-xs font-black text-white",
                  DIFF_COLORS[selectedSong.difficulty],
                )}
              >
                {selectedSong.difficultyLevel}
                {selectedSong.difficulty.charAt(0)}
              </span>
              <span className="truncate text-sm font-bold text-bpim-text">
                {selectedSong.title}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-bpim-muted">
                {t("optimizer.customGoal.targetExScore")}
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={maxScore ?? undefined}
                value={exScoreInput}
                onChange={(e) => setExScoreInput(e.target.value)}
                className="h-9 font-mono"
              />
              <div className="flex flex-wrap gap-1.5">
                {quickScoreOptions(selectedSong.notes).map((opt) => (
                  <Button
                    key={opt.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-bold"
                    onClick={() => setExScoreInput(String(opt.score))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("optimizer.customGoal.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSong || !isExScoreValid}
          >
            {initialTarget
              ? t("optimizer.customGoal.updateTarget")
              : t("optimizer.customGoal.addTarget")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SongTargetModal;
