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
 * 現行実装と異なり -15 の床は設けない（issue #303 の論点そのものであり、
 * 床の有無自体を新旧で見比べられるようにするため）。
 */
export class NewBpiCalculator {
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
   * @returns BPI値。パラメータ未整備の楽曲は `null`
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
    return Math.round(bpi * 100) / 100;
  }
}
