

import { RANK_TABLE } from "@/constants/iidx/rankBorders";

import { BpiCalculator } from "@/lib/bpi";
import type { IBpiBasicSongData } from "@/types/songs/bpi";


import { CustomGoalTargetInput } from "@/components/partials/features/Analytics/BpiOptimizer/ui/CustomGoal/SongTargetModal/types";

export const toBpiSongData = (
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

export const QUICK_SCORE_LABELS = ["A", "AA", "AAA", "MAX-"] as const;

export function quickScoreOptions(
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

export const BPI_QUICK_TARGETS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** BPI 0/10/.../100を達成するのに必要なEXスコアの早見表（mu/sigmaが無い曲では逆算できないため空になる）。 */
export function bpiQuickOptions(
  song: Pick<
    CustomGoalTargetInput,
    "notes" | "kaidenAvg" | "wrScore" | "coef" | "mu" | "sigma" | "residualVar"
  >,
): { bpi: number; score: number }[] {
  const maxScore = song.notes * 2;
  const bpiSong = toBpiSongData(song);
  return BPI_QUICK_TARGETS.map((bpi) => {
    const rawScore = BpiCalculator.calcFromBPI(bpi, bpiSong);
    if (rawScore == null) return null;
    return { bpi, score: Math.min(maxScore, Math.max(0, rawScore)) };
  }).filter((opt): opt is { bpi: number; score: number } => opt != null);
}

export const scoreRate = (score: number, notes: number) =>
  notes > 0 ? (score / (notes * 2)) * 100 : 0;
