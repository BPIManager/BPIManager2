import { V2_DEFAULTS } from "@bpim/bpicalc";
import { BpiCalculator } from "@/lib/bpi";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

/**
 * 総合BPIの計算を BpiCalculator.calculateTotalBPI へ委譲し、数式を再実装しない。ダッシュボード等の表示値と一致させるため。
 * シフト量は BpiCalculator の BpiV2 と同じ V2_DEFAULTS.totalBpiShift を使う（上書きしていないため既定値のまま）。
 */
export class TotalBpiEvaluator {
  private static readonly SHIFT = V2_DEFAULTS.totalBpiShift;

  constructor(private readonly totalSongCount: number) {}

  /** 厳密な総合BPI。`BpiCalculator.calculateTotalBPI`へ委譲する。 */
  exact(
    observations: IBpiScoreObservation[],
    allSongs: (IBpiBasicSongData & { songId: number })[],
  ): number {
    return BpiCalculator.calculateTotalBPI(observations, allSongs);
  }

  /**
   * シフト法べき乗平均の再校正指数`k'`（`docs/bpi-math.md` §4.3）。
   * `marginalGainEstimate`の解析的勾配で使う。
   */
  get shiftedPowerMeanExponent(): number {
    const c = TotalBpiEvaluator.SHIFT;
    return Math.log(this.totalSongCount) / Math.log((100 + c) / (50 + c));
  }

  /**
   * 総合BPI T の BPI_i に関する解析的勾配 ∂T/∂BPI_i（提案書§2.4）。候補の一次選抜（足切り）専用の近似で、最終判定には exact を使う。
   */
  marginalGainEstimate(currentTotal: number, songBpi: number, kPrime: number): number {
    const c = TotalBpiEvaluator.SHIFT;
    const base = (songBpi + c) / (currentTotal + c);
    return Math.pow(Math.max(0, base), kPrime - 1) / this.totalSongCount;
  }
}
