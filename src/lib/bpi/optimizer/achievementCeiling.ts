import type { ChartParamsV2 } from "@bpim/bpicalc";
import { BpiOptimizerConstants } from "./constants";
import { LatentSkillModel } from "./latentSkillModel";
import { bpiFromZ, zFromBpi, zOf } from "./zScale";
import type { SongOptimizerInput } from "@/types/bpi-optimizer";

/**
 * 1曲について「どこまで伸ばすことを目標にするか」（ceiling BPI）を、プレイ済み・
 * 未プレイを同じ考え方で見積もる（提案書§3.4）。
 *
 * z_baseline_j = プレイ済み: 実測z値 / 未プレイ: a_shrunk + categoryBias_c
 * ceiling_j    = f_j(z_baseline_j + GROWTH_MARGIN_Z)
 *
 * `GROWTH_MARGIN_Z`は「モデルが説明しない伸びしろ」（詰め・厳選プレイ等）を表す
 * 唯一の裁量パラメータで、プレイ済み・未プレイで共通の1個だけを使う。
 *
 * `considerCurrentTotalBpi=false`のときは、現在の実力に基づく`z_baseline`を
 * 使わず、目標総合BPIの値をこの曲固有のカーブで逆変換したz値を下限として使う
 * （「現在の実力に縛られず、目標到達に必要な水準まで伸ばせると仮定する」というUIの
 * トグルの意味を、V1時代の`considerCurrentTotalBpi`から引き継ぐ）。
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
