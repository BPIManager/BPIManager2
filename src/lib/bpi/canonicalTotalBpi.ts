import { BpiCalculator } from "@/lib/bpi";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

type MasterSong = IBpiBasicSongData & {
  songId: number;
  difficultyLevel: number | null;
};

/**
 * 総合BPIの標準定義。☆11+12の全観測で潜在スキルを推定し、☆12全曲を母数に未プレイ曲を予測して集約する（ラチェット適用前）。
 *
 * @param scores - ユーザーの最新スコア（☆11+12を含む）
 * @param songMaster - 楽曲マスタ（レベルを問わず渡してよい。☆12のみを母数にする）
 */
export function computeCanonicalTotalBpi(
  scores: { songId: number | null; notes: number | string; exScore: number | string | null }[],
  songMaster: MasterSong[],
): number {
  const level12Master = songMaster.filter((s) => s.difficultyLevel === 12);
  const observations: IBpiScoreObservation[] = scores
    .filter((s) => s.songId != null && s.exScore != null)
    .map((s) => ({
      songId: s.songId as number,
      notes: Number(s.notes),
      exScore: Number(s.exScore),
    }));
  return BpiCalculator.calculateTotalBPI(observations, level12Master);
}
