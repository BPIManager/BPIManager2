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
import { RANK_TABLE, getRankDetail } from "@/constants/iidx/rankBorders";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { BpiCalculator } from "@/lib/bpi";
import type { IBpiBasicSongData } from "@/types/songs/bpi";
import type { RadarCategory } from "@/types/stats/radar";
import { MiniBpiChip } from "@/components/partials/common/OptimizerGoalCard";
import { RADAR_LABELS } from "../shared";
import {
  useSongSearch,
  type SongSearchResult,
  type BpmBand,
} from "@/hooks/songs/useSongSearch";
import { useTranslation } from "@/hooks/common/useTranslation";

type SearchMode = "title" | "radar" | "bpm";
const SEARCH_MODES: SearchMode[] = ["title", "radar", "bpm"];
const BPM_BANDS: BpmBand[] = ["slow", "mid", "fast", "soflan"];

export interface CustomGoalTargetInput {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  toExScore: number;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

const toBpiSongData = (
  song: Pick<
    CustomGoalTargetInput,
    "notes" | "kaidenAvg" | "wrScore" | "coef" | "mu" | "sigma" | "residualVar"
  >,
): IBpiBasicSongData => ({
  notes: song.notes,
  kaidenAvg: song.kaidenAvg,
  wrScore: song.wrScore,
  coef: song.coef,
  mu: song.mu,
  sigma: song.sigma,
  residualVar: song.residualVar,
});

const QUICK_SCORE_LABELS = ["A", "AA", "AAA", "MAX-"] as const;

function quickScoreOptions(
  song: Pick<
    CustomGoalTargetInput,
    "notes" | "kaidenAvg" | "wrScore" | "coef" | "mu" | "sigma" | "residualVar"
  >,
): { label: string; score: number; bpi: number | null }[] {
  const maxScore = song.notes * 2;
  const ratioByLabel = new Map(RANK_TABLE.map((r) => [r.label, r.ratio]));
  const bpiSong = toBpiSongData(song);
  const scores = [
    ...QUICK_SCORE_LABELS.map((label) => ({
      label,
      score: Math.ceil(maxScore * (ratioByLabel.get(label) ?? 0)),
    })),
    { label: "MAX", score: maxScore },
  ];
  return scores.map((opt) => ({
    ...opt,
    bpi: BpiCalculator.calc(opt.score, bpiSong),
  }));
}

const scoreRate = (score: number, notes: number) =>
  notes > 0 ? (score / (notes * 2)) * 100 : 0;

const SongTargetModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialTarget,
  currentScores,
  difficultyLevel = 12,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (target: CustomGoalTargetInput) => void;
  initialTarget?: CustomGoalTargetInput;
  currentScores: Map<number, number | null>;
  difficultyLevel?: number;
}) => {
  const { t, tFormat } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const [radarCategory, setRadarCategory] = useState<RadarCategory | null>(
    null,
  );
  const [bpmBand, setBpmBand] = useState<BpmBand | null>(null);
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
        wrScore: initialTarget.wrScore,
        kaidenAvg: initialTarget.kaidenAvg,
        coef: initialTarget.coef,
        mu: initialTarget.mu,
        sigma: initialTarget.sigma,
        residualVar: initialTarget.residualVar,
      });
      setExScoreInput(String(initialTarget.toExScore));
    } else {
      setSelectedSong(null);
      setExScoreInput("");
    }
    setQuery("");
    setDebouncedQuery("");
    setSearchMode("title");
    setRadarCategory(null);
    setBpmBand(null);
  }, [isOpen, initialTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { songs, isLoading } = useSongSearch(
    searchMode === "title" ? debouncedQuery : "",
    {
      difficultyLevel,
      radarCategory: searchMode === "radar" ? (radarCategory ?? undefined) : undefined,
      bpmBand: searchMode === "bpm" ? (bpmBand ?? undefined) : undefined,
    },
  );
  const hasBrowseSelection =
    searchMode === "title"
      ? debouncedQuery.length > 0
      : searchMode === "radar"
        ? radarCategory != null
        : bpmBand != null;
  const titleFilter = debouncedQuery.trim().toLowerCase();
  const displaySongs =
    searchMode === "title" || titleFilter.length === 0
      ? songs
      : songs.filter((song) => song.title.toLowerCase().includes(titleFilter));

  const maxScore = selectedSong ? selectedSong.notes * 2 : null;
  const exScoreNum = parseInt(exScoreInput, 10);
  const currentExScore = selectedSong
    ? (currentScores.get(selectedSong.songId) ?? null)
    : null;
  const isExScoreValid =
    !isNaN(exScoreNum) &&
    exScoreNum >= 0 &&
    (maxScore == null || exScoreNum <= maxScore) &&
    (currentExScore == null || exScoreNum >= currentExScore);
  const enteredRate =
    selectedSong && !isNaN(exScoreNum)
      ? scoreRate(exScoreNum, selectedSong.notes)
      : null;
  const rankDetail =
    selectedSong && !isNaN(exScoreNum)
      ? getRankDetail(exScoreNum, selectedSong.notes * 2)
      : null;
  const rankDetailText = rankDetail
    ? rankDetail.label === "MAX-"
      ? `MAX - ${rankDetail.shortage}`
      : `${rankDetail.label} + ${rankDetail.surplus}`
    : null;
  const enteredBpi =
    selectedSong && !isNaN(exScoreNum)
      ? BpiCalculator.calc(exScoreNum, toBpiSongData(selectedSong))
      : null;
  const diffFromCurrent =
    selectedSong && !isNaN(exScoreNum)
      ? exScoreNum - (currentExScore ?? 0)
      : null;

  const handleConfirm = () => {
    if (!selectedSong || !isExScoreValid) return;
    onConfirm({
      songId: selectedSong.songId,
      title: selectedSong.title,
      difficulty: selectedSong.difficulty,
      difficultyLevel: selectedSong.difficultyLevel,
      notes: selectedSong.notes,
      toExScore: exScoreNum,
      wrScore: selectedSong.wrScore,
      kaidenAvg: selectedSong.kaidenAvg,
      coef: selectedSong.coef,
      mu: selectedSong.mu,
      sigma: selectedSong.sigma,
      residualVar: selectedSong.residualVar,
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
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 gap-1 rounded-lg bg-bpim-overlay/30 p-1">
              {SEARCH_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSearchMode(mode)}
                  className={cn(
                    "flex-1 truncate rounded-md py-1.5 text-[11px] font-bold transition-colors",
                    searchMode === mode
                      ? "bg-bpim-primary text-white"
                      : "text-bpim-muted hover:text-bpim-text",
                  )}
                >
                  {t(`optimizer.customGoal.searchMode.${mode}`)}
                </button>
              ))}
            </div>

            {searchMode === "title" && (
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
            )}

            {searchMode === "radar" && (
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {ALL_RADAR_CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={radarCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRadarCategory(cat)}
                    >
                      {RADAR_LABELS[cat]}
                    </Button>
                  ))}
                </div>
                {radarCategory != null && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("optimizer.customGoal.filterByTitle")}
                      className="pl-8 h-9"
                    />
                  </div>
                )}
              </div>
            )}

            {searchMode === "bpm" && (
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {BPM_BANDS.map((band) => (
                    <Button
                      key={band}
                      type="button"
                      variant={bpmBand === band ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBpmBand(band)}
                    >
                      {t(`optimizer.customGoal.bpmBand.${band}`)}
                    </Button>
                  ))}
                </div>
                {bpmBand != null && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("optimizer.customGoal.filterByTitle")}
                      className="pl-8 h-9"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex min-w-0 max-h-72 flex-col gap-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <CircleDashed className="h-4 w-4 animate-spin text-bpim-muted" />
                </div>
              )}
              {!isLoading && hasBrowseSelection && displaySongs.length === 0 && (
                <p className="py-8 text-center text-xs text-bpim-subtle">
                  {t("optimizer.customGoal.noResults")}
                </p>
              )}
              {displaySongs.map((song) => (
                <button
                  key={`${song.songId}`}
                  onClick={() => setSelectedSong(song)}
                  className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-bpim-overlay/50 transition-colors"
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
                  <span className="min-w-0 flex-1 truncate text-sm text-bpim-text">
                    {song.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
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
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-xs font-black text-white",
                    DIFF_COLORS[selectedSong.difficulty],
                  )}
                >
                  {selectedSong.difficultyLevel}
                  {selectedSong.difficulty.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-bpim-text">
                  {selectedSong.title}
                </span>
              </div>
              <span className="text-xs text-bpim-muted">
                {currentExScore != null
                  ? tFormat("optimizer.customGoal.currentScore", {
                      score: currentExScore,
                      rate: scoreRate(currentExScore, selectedSong.notes).toFixed(2),
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
