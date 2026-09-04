import type { IBpiBasicSongData } from "@/types/songs/bpi";

/**
 * BPI（Beat Power Indicator）計算ロジックを提供する静的クラス。
 *
 * - 単曲 BPI の計算（`calc`）
 * - BPI からスコアの逆算（`calcFromBPI`）
 * - 総合 BPI のべき乗平均計算（`calculateTotalBPI`）
 * - 順位推定（`estimateRank`）
 */
export class BpiCalculator {
  private static readonly DEFAULT_POW_COEF = 1.175;
  private static readonly AVERAGE_OF_ALL_KAIDENS = 2699;

  /** 単曲 BPI の下限。未プレイ楽曲もこの値として扱う。 */
  public static readonly BPI_FLOOR = -15;

  /**
   * 総合 BPI のべき乗平均を非負の値域で行うためのシフト量。
   *
   * べき乗平均は負の値を扱えないため、下限 `BPI_FLOOR` が 0 に移るだけのシフトを掛ける。
   * これにより「未プレイ楽曲＝寄与ゼロ」がそのまま成立する。
   */
  private static readonly TOTAL_BPI_SHIFT = -BpiCalculator.BPI_FLOOR;

  private static pgf(j: number, m: number): number {
    if (j === m) return m * 0.8;
    return 1 + (j / m - 0.5) / (1 - j / m);
  }

  /**
   * 総合BPIのべき乗平均で使用する指数を計算する。
   *
   * 「1曲だけ全一(BPI 100)を持ち、他が全て未プレイなら総合 BPI が 50 になる」という
   * BPI 本来の設計性質を満たす指数。シフト量 `c` のもとでこの性質は
   * `n^(1/k) = (100 + c) / (50 + c)` と同値なので、そこから k を解いて得られる。
   * （シフトしない場合の `log2(n)` は c = 0 のときの解にあたる）
   *
   * @param totalSongCount - 対象楽曲の総数
   */
  public static totalBpiExponent(totalSongCount: number): number {
    const c = this.TOTAL_BPI_SHIFT;
    return Math.max(
      1,
      Math.log(totalSongCount) / Math.log((100 + c) / (50 + c)),
    );
  }

  /**
   * 単曲 BPI を計算する。
   *
   * @param s - プレイヤーの EX スコア
   * @param song - 楽曲データ（ノーツ数・皆伝平均・WR スコア・補正係数）
   * @returns BPI 値（`BPI_FLOOR` 〜 理論上限）。スコアが最大値を超える場合は `null`
   */
  public static calc(s: number, song: IBpiBasicSongData): number | null {
    const { notes, kaidenAvg: k, wrScore: z, coef } = song;
    if (k === null || z === null || notes === 0) return this.BPI_FLOOR;
    const m = notes * 2;

    if (s > m) return null;
    if (s < 0) return this.BPI_FLOOR;

    const _k = this.pgf(k, m);
    const _s_ = this.pgf(s, m) / _k;
    const _z_ = this.pgf(z, m) / _k;
    const p = s >= k;
    const powCoef = coef && coef > 0 ? coef : this.DEFAULT_POW_COEF;

    const logS = p ? Math.log(_s_) : -Math.log(_s_);
    const logZ = Math.log(_z_);

    if (Math.abs(logZ) < 0.00001) return 0;

    const res =
      Math.round(
        (p ? 100 : -100) * Math.pow(Math.abs(logS / logZ), powCoef) * 100,
      ) / 100;
    return isNaN(res) ? null : Math.max(this.BPI_FLOOR, res);
  }

  /**
   * 目標 BPI を達成するために必要な EX スコアを逆算する。
   *
   * @param targetBpi - 目標とする BPI 値
   * @param song - 楽曲データ
   * @param ceiled - `true` の場合は切り上げ、`false` の場合は小数のまま返す（デフォルト: `true`）
   * @returns 目標 BPI を達成するための EX スコア（0 〜 最大スコア）
   */
  public static calcFromBPI(
    targetBpi: number,
    song: IBpiBasicSongData,
    ceiled: boolean = true,
  ): number {
    const { notes, kaidenAvg, wrScore, coef } = song;
    if (kaidenAvg === null || wrScore === null || notes === 0) return 0;
    const m = notes * 2;
    const powCoef = coef && coef > 0 ? coef : this.DEFAULT_POW_COEF;

    const _k = this.pgf(kaidenAvg, m);
    const logZ = Math.log(this.pgf(wrScore, m) / _k);

    const inner =
      (targetBpi >= 0 ? 1 : -1) *
      Math.pow(Math.abs(targetBpi) / 100, 1 / powCoef) *
      logZ;
    const _s = _k * Math.exp(inner);

    const res = m * ((_s - 0.5) / _s);

    if (res > m) return m;
    if (res < 0) return 0;

    return ceiled ? Math.ceil(res) : res;
  }

  /**
   * 総合 BPI をべき乗平均で計算する。
   *
   * 全楽曲数に対してプレイしていない楽曲は BPI `BPI_FLOOR` として扱う。
   *
   * 各単曲 BPI を `+TOTAL_BPI_SHIFT` して非負域へ移してからべき乗平均を取り、
   * 最後にシフトを戻す。混合符号のまま冪を取ると値は平均ではなく符号付き
   * L^k ノルムになり、絶対値最大の 1 曲に支配されて符号反転点で不連続に飛ぶ
   * （下限で埋まった未プレイ曲が多いほど顕著になる）。
   *
   * この形は単調かつ 1-Lipschitz で、どの 1 曲を Δ 改善しても総合の変化は
   * Δ を超えない。`totalBpiExponent` の校正により「1曲全一 + 残り未プレイ = 50」
   * および「全曲同一 BPI ならその値そのもの」は従来どおり成立する。
   *
   * @param allBpis - 各楽曲の BPI 配列（降順ソート推奨）
   * @param totalSongCount - 対象楽曲の総数
   * @returns 総合 BPI 値
   */
  public static calculateTotalBPI(
    allBpis: number[],
    totalSongCount: number,
  ): number {
    if (totalSongCount === 0) return this.BPI_FLOOR;

    const c = this.TOTAL_BPI_SHIFT;
    const k = this.totalBpiExponent(totalSongCount);

    let sum = 0;
    for (let i = 0; i < totalSongCount; i++) {
      //未プレイ楽曲がある（totalSongCountにallBpisが満たない場合）は、下限で埋める
      const bpi = i < allBpis.length ? allBpis[i] : this.BPI_FLOOR;
      // 下限を下回る値が渡されても負の底で冪を取らないようクランプする
      const shifted = Math.max(0, bpi + c);
      sum += Math.pow(shifted, k) / totalSongCount;
    }

    return Math.round((Math.pow(sum, 1 / k) - c) * 100) / 100;
  }

  /**
   * 総合 BPI から皆伝内おおよその順位を推定する。
   *
   * @param totalBpi - 総合 BPI 値
   * @returns 推定順位（整数）
   */
  public static estimateRank(totalBpi: number): number {
    const p = 100;
    return Math.ceil(Math.pow(this.AVERAGE_OF_ALL_KAIDENS, (p - totalBpi) / p));
  }
}
