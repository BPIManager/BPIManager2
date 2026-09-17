import { BpiOptimizerConstants } from "./constants";
import { LatentSkillModel } from "./latentSkillModel";
import type { ColdCategoryAdvisory, SongOptimizerInput } from "@/types/bpi-optimizer";
import type { RadarCategory } from "@/types/stats/radar";

/**
 * レーダーカテゴリ別の得意・不得意バイアス`categoryBias_c`は`info_c`が小さいと
 * 自動的に0へ縮小されるが、それは「静かにグローバル予測へフォールバックする」だけで
 * 終わる。データが薄いカテゴリについては、無理な推定で弱いプランを出すより
 * 先に数曲プレイしてもらう方が誠実、というユーザー指摘に基づくガード（提案書§3.7）。
 *
 * @param categories - 判定対象のレーダーカテゴリ（`radarElementFilter`適用後）
 * @param latentSkill - 信頼度`w_c = info_c/(info_c+1)`の参照元
 * @param allSongs - 曲候補の探索対象。プレイ数の集計・提案曲の抽出に使う
 * @returns 信頼度が閾値未満の「コールド」なカテゴリの案内一覧
 */
export function detectColdCategories(
  categories: RadarCategory[],
  latentSkill: LatentSkillModel,
  allSongs: SongOptimizerInput[],
): ColdCategoryAdvisory[] {
  return categories
    .filter(
      (category) =>
        latentSkill.categoryConfidence(category) <
        BpiOptimizerConstants.CATEGORY_CONFIDENCE_THRESHOLD,
    )
    .map((category) => {
      const inCategory = allSongs.filter((s) => s.radarCategory === category);
      const playedCount = inCategory.filter((s) => s.currentExScore != null).length;
      const suggestions = inCategory
        .filter((s) => s.currentExScore == null)
        .sort((a, b) => a.notes - b.notes)
        .slice(0, BpiOptimizerConstants.COLD_START_SUGGESTION_COUNT)
        .map((s) => ({ songId: s.songId, title: s.title, difficulty: s.difficulty }));
      return { category, playedCount, suggestions };
    });
}
