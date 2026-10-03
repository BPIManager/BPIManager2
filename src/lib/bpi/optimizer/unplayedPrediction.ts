import type { ChartParamsV2 } from "@bpim/bpicalc";
import { BpiOptimizerConstants } from "./constants";
import { bpiFromZ } from "./zScale";

/**
 * 未プレイ曲の現在の予測 BPI（@bpim/bpicalc の predictUnplayed と同式）。今の総合BPIと一致させるためカテゴリ補正は含めない（achievementCeiling.ts 参照）。
 */
export function predictUnplayedBpi(
  chartParams: ChartParamsV2,
  aShrunk: number,
  confidence: number,
): number {
  const raw = bpiFromZ(aShrunk, chartParams.z0, chartParams.z100, chartParams.k);
  const blended = confidence * raw + (1 - confidence) * BpiOptimizerConstants.BPI_FLOOR;
  return Math.max(BpiOptimizerConstants.BPI_FLOOR, Math.round(blended * 100) / 100);
}
