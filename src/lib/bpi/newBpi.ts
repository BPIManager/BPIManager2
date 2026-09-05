import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
} from "@/constants/iidx/newBpi/songParams";

/**
 * issue #299〜304 で提案されている分布ベース（2母数潜在能力モデル）の
 * 単曲BPI計算（検証用）。
 *
 * `BpiCalculator`（本番実装）とは独立したモジュール。`mu`/`sigma` は
 * `songDef` に持たせず `songParams.json`（ALS推定の生成物）から読む。
 *
 * z = (t - mu) / sigma,  t = -ln(m - s)
 * newBpi = 100 * (z - z0) / (z100 - z0)
 *
 * 床の撤廃自体がissue #303の論点だが、比較UIでの見え方を現行に揃えるため
 * 暫定的に現行と同じ `BPI_FLOOR`（-15）でクランプしている。恒久対応（尺度の
 * 正式決定）はissue #303で行う。
 */
export class NewBpiCalculator {
  /** 単曲BPIの下限。現行実装(`BpiCalculator`)に合わせた暫定値。 */
  public static readonly BPI_FLOOR = -15;

  /**
   * 指定楽曲の分布パラメータ（mu/sigma）が用意されているかどうか。
   * 生成元データでプレイ数が少なすぎた楽曲は含まれない。
   */
  public static hasParams(songId: number): boolean {
    return newBpiSongParamMap.has(songId);
  }

  /**
   * 新方式（z尺度）での単曲BPIを計算する。
   *
   * @param exScore - プレイヤーの EX スコア
   * @param songId - 楽曲ID（`songParams.json` 参照キー）
   * @param notes - ノーツ数
   * @returns BPI値（`BPI_FLOOR` 〜 理論上限）。パラメータ未整備の楽曲は `null`
   */
  public static calc(
    exScore: number,
    songId: number,
    notes: number,
  ): number | null {
    const param = newBpiSongParamMap.get(songId);
    if (!param || notes === 0) return null;

    const m = notes * 2;
    const miss = Math.max(0.5, m - Math.min(exScore, m));
    const t = -Math.log(miss);
    const z = (t - param.mu) / param.sigma;
    const bpi = 100 * ((z - NEW_BPI_Z0) / (NEW_BPI_Z100 - NEW_BPI_Z0));
    return Math.max(this.BPI_FLOOR, Math.round(bpi * 100) / 100);
  }

  /**
   * 新方式（z尺度）で目標BPIを達成するために必要なEXスコアを逆算する。
   * `BpiCalculator.calcFromBPI` の新方式版（推移グラフ描画用）。
   *
   * @param targetBpi - 目標とするBPI値
   * @param songId - 楽曲ID（`songParams.json` 参照キー）
   * @param notes - ノーツ数
   * @returns 目標BPIを達成するためのEXスコア（0〜最大スコア）。パラメータ未整備の楽曲は `null`
   */
  public static calcFromBPI(
    targetBpi: number,
    songId: number,
    notes: number,
  ): number | null {
    const param = newBpiSongParamMap.get(songId);
    if (!param || notes === 0) return null;

    const m = notes * 2;
    const z = NEW_BPI_Z0 + (targetBpi * (NEW_BPI_Z100 - NEW_BPI_Z0)) / 100;
    const t = param.mu + param.sigma * z;
    const miss = Math.exp(-t);
    const s = m - miss;

    if (s > m) return m;
    if (s < 0) return 0;
    return s;
  }
}
