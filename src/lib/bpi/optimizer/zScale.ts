import { tOf } from "@bpim/bpicalc";

/**
 * BPI(V2)のz尺度（潜在能力位置）関連の純粋関数。
 * `docs/bpi-math.md` §7.3、`@bpim/bpicalc`の`ChartBpiV2`(v2.ts)と同じ式。
 */

/**
 * 実測EXスコアを曲固有のz尺度に変換する（z_ij = (t_ij - mu_j) / sigma_j）。
 *
 * @param mu - 曲の位置パラメータ
 * @param sigma - 曲の弁別力パラメータ
 * @param notes - ノーツ数（理論値 m = notes*2 の算出に使う）
 * @param exScore - EXスコア
 */
export function zOf(mu: number, sigma: number, notes: number, exScore: number): number {
  return (tOf(exScore, notes * 2) - mu) / sigma;
}

/**
 * z尺度の値を曲固有のカーブ（z0・z100・k）でBPIへ変換する（100%z_ij用ではなく汎用）。
 * `ChartBpiV2.bpi`/`rawFromSkill`と同じ式（`100 * sign(ratio) * |ratio|^k`）。
 * 下限・上限のクランプは呼び出し元の責務とする（用途により異なるため）。
 */
export function bpiFromZ(z: number, z0: number, z100: number, k: number): number {
  const ratio = (z - z0) / (z100 - z0);
  return 100 * Math.sign(ratio) * Math.pow(Math.abs(ratio), k);
}

/** `bpiFromZ`の逆関数。BPI値を曲固有カーブのz尺度へ逆変換する。 */
export function zFromBpi(bpi: number, z0: number, z100: number, k: number): number {
  const sign = Math.sign(bpi) || 1;
  const ratio = sign * Math.pow(Math.abs(bpi) / 100, 1 / k);
  return z0 + ratio * (z100 - z0);
}
