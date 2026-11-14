import { BPM_CONST } from "@/constants/iidx/bpmBands";

/** 相対評価の分母が極端に小さくなり、わずかな伸びが過大に見えないようにする下限（BPI点） */
const MIN_BASE = 1;

/**
 * 更新前を 1.00 としたときの、更新後の相対評価を返す。
 * BPI は負値にもなるため、床値(-15)を原点にずらした値の比（(after+15)/(before+15)）で表す。
 */
export function toRelativeBpi(before: number, after: number): number {
  const base = Math.max(before - BPM_CONST.BPI_MIN, MIN_BASE);
  return (after - BPM_CONST.BPI_MIN) / base;
}

/**
 * 相対評価のレーダーの表示範囲を返す。更新前（1.00）が外周に張り付かず、伸びが見えるように、
 * 最大の乖離に余白を持たせた範囲にする。
 */
export function relativeRadarDomain(relativeValues: number[]): [number, number] {
  const maxDeviation = Math.max(
    0.01,
    ...relativeValues.map((v) => Math.abs(v - 1)),
  );
  const margin = maxDeviation * 1.2;
  return [1 - margin * 1.5, 1 + margin];
}
