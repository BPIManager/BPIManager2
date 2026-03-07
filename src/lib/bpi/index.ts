import { SongWithDef } from "@/types/songs/songMaster";

export interface IBpiBasicSongData {
  title?: string;
  notes: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef?: number | null;
}

export class BpiCalculator {
  private static readonly DEFAULT_POW_COEF = 1.175;
  private static readonly TOTAL_KAIDENS = 2699;

  private static pgf(j: number, m: number): number {
    if (j === m) return m * 0.8;
    return 1 + (j / m - 0.5) / (1 - j / m);
  }

  /**
   * 単曲BPIの計算
   */
  public static calc(s: number, song: IBpiBasicSongData): number | null {
    const { notes, kaidenAvg: k, wrScore: z, coef } = song;
    const m = notes * 2;

    if (s > m) return null;
    if (s < 0) return -15;

    const _s = this.pgf(s, m);
    const _k = this.pgf(k, m);
    const _z = this.pgf(z, m);

    const _s_ = _s / _k;
    const _z_ = _z / _k;

    const p = s >= k;
    const powCoef = coef && coef > 0 ? coef : this.DEFAULT_POW_COEF;

    const logS = p ? Math.log(_s_) : -Math.log(_s_);
    const logZ = Math.log(_z_);

    if (Math.abs(logZ) < 0.00001) return 0;

    const rawBPI = (p ? 100 : -100) * Math.pow(Math.abs(logS / logZ), powCoef);
    let res = Math.round(rawBPI * 100) / 100;

    return isNaN(res) ? null : Math.max(-15, res);
  }

  /**
   * BPIから必要なスコアを逆算する
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
    const _z = this.pgf(wrScore, m);
    const logZ = Math.log(_z / _k);

    const isPositive = targetBpi >= 0;
    const absBpi = Math.abs(targetBpi);

    const inner = Math.pow(absBpi / 100, 1 / powCoef) * logZ;
    const _s = isPositive ? _k * Math.exp(inner) : _k * Math.exp(-inner);

    const res = m * ((_s - 0.5) / _s);

    if (res > m) return m;
    if (res < 0) return 0;

    return ceiled ? Math.ceil(res) : res;
  }

  /**
   * 総合BPIの計算 (べき乗平均)
   */
  public static calculateTotalBPI(
    allBpis: number[],
    totalSongCount: number,
  ): number {
    if (totalSongCount === 0) return -15;

    let k = Math.log2(totalSongCount);
    if (k === 0) k = 1;

    let sum = 0;
    for (let i = 0; i < totalSongCount; i++) {
      const bpi = i < allBpis.length ? allBpis[i] : -15;
      const m = Math.pow(Math.abs(bpi), k) / totalSongCount;
      sum += bpi > 0 ? m : -m;
    }

    const res = Math.round(Math.pow(Math.abs(sum), 1 / k) * 100) / 100;
    return sum > 0 ? res : -res;
  }

  /**
   * 順位推定
   */
  public static estimateRank(totalBpi: number): number {
    const p = 100;
    return Math.ceil(Math.pow(this.TOTAL_KAIDENS, (p - totalBpi) / p));
  }
}
