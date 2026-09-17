import { V2_DEFAULTS } from "@bpim/bpicalc";
import { BpiCalculator } from "@/lib/bpi";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

/**
 * 総合BPIの計算を担う。数式（シフト法べき乗平均）は一切再実装せず、
 * `BpiCalculator.calculateTotalBPI`（＝アプリの他画面と共通のV2実装）へ委譲する。
 * これにより、オプティマイザが返す`currentTotalBpi`は常にダッシュボード等が
 * 表示する値と一致する（V1延命実装が抱えていた不整合の再発を防ぐ）。
 *
 * シフト量`c`は`BpiCalculator`が使う`BpiV2`インスタンスと同じ`V2_DEFAULTS.totalBpiShift`
 * （`bpiFloor`/`totalBpiShift`等は`BpiCalculator`のコンストラクタでも上書きしていないため既定値のまま）。
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
   * 総合BPI T = (Σ(BPI_i+c)^k'/n)^(1/k') - c を1曲のBPI_iについて偏微分した
   * 解析的勾配 ∂T/∂BPI_i = ((BPI_i+c)/(T+c))^(k'-1) / n（提案書§2.4）。
   * 候補の一次選抜（足切り）専用の近似であり、最終判定には`exact`を使う。
   */
  marginalGainEstimate(currentTotal: number, songBpi: number, kPrime: number): number {
    const c = TotalBpiEvaluator.SHIFT;
    const base = (songBpi + c) / (currentTotal + c);
    return Math.pow(Math.max(0, base), kPrime - 1) / this.totalSongCount;
  }
}
