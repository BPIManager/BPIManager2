import type { ChartParamsV2 } from "@bpim/bpicalc";
import { BpiOptimizerConstants } from "./constants";
import { bpiFromZ } from "./zScale";

/**
 * 未プレイ曲の「現在の」予測BPI（`@bpim/bpicalc`の`PlayerBpiV2.predictUnplayed`と同じ式）。
 * カテゴリ補正は含めない（グローバルな`a_shrunk`のみ）——「今の総合BPI」の算出に使う値と
 * 一致させるため（カテゴリ補正はあくまで目標設定用。`achievementCeiling.ts`参照）。
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
