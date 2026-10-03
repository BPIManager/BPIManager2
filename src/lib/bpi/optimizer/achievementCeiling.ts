import type { ChartParamsV2 } from "@bpim/bpicalc";
import { BpiOptimizerConstants } from "./constants";
import { LatentSkillModel } from "./latentSkillModel";
import { bpiFromZ, zFromBpi, zOf } from "./zScale";
import type { SongOptimizerInput } from "@/types/bpi-optimizer";

/**
 * 1曲の目標 ceiling BPI を、プレイ済み・未プレイで同じ式により見積もる（提案書§3.4）。
 * ceiling_j = f_j(z_baseline_j + GROWTH_MARGIN_Z)。considerCurrentTotalBpi=false なら目標総合BPIから逆算したz値を下限とする。
 */
export function resolveCeilingBpi(
  song: SongOptimizerInput,
  chartParams: ChartParamsV2,
  latentSkill: LatentSkillModel,
  targetTotalValue: number,
  considerCurrentTotalBpi: boolean,
): number {
  const { mu, sigma, z0, z100, k } = chartParams;

  let zBaseline =
    song.currentExScore != null
      ? zOf(mu, sigma, song.notes, song.currentExScore)
      : (latentSkill.aShrunk ?? 0) +
        (song.radarCategory ? latentSkill.categoryBias(song.radarCategory) : 0);

  if (!considerCurrentTotalBpi) {
    zBaseline = Math.max(zBaseline, zFromBpi(targetTotalValue, z0, z100, k));
  }

  const ceiling = bpiFromZ(zBaseline + BpiOptimizerConstants.GROWTH_MARGIN_Z, z0, z100, k);
  return Math.min(
    BpiOptimizerConstants.MAX_BPI,
    Math.max(BpiOptimizerConstants.BPI_FLOOR, ceiling),
  );
}
