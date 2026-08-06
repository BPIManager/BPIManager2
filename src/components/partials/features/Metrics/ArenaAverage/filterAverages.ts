import type { ArenaAverageData } from "@/types/metrics/arena";
import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import type { DetailFilter } from "@/components/partials/features/Metrics/ArenaAverageFilter/ui";

/**
 * アリーナ平均一覧を、選択された難易度・楽曲名検索・詳細フィルタ（スコア・スコアレート・DJ RANK閾値）で絞り込む。
 *
 * @param averages - フィルタ対象のアリーナ平均データ
 * @param params.selectedDifficulties - 表示対象の難易度セット
 * @param params.nameSearch - 楽曲名の部分一致検索文字列
 * @param params.detailFilters - スコア・スコアレート・DJ RANKの詳細フィルタ
 */
export function filterArenaAverages(
  averages: ArenaAverageData[],
  params: {
    selectedDifficulties: Set<string>;
    nameSearch: string;
    detailFilters: DetailFilter[];
  },
): ArenaAverageData[] {
  const { selectedDifficulties, nameSearch, detailFilters } = params;

  return averages.filter((item) => {
    if (!selectedDifficulties.has(item.difficulty)) return false;

    if (
      nameSearch &&
      !item.title.toLowerCase().includes(nameSearch.toLowerCase())
    )
      return false;

    for (const f of detailFilters) {
      if (!f.value) continue;
      const stats = item.averages[f.rank];
      if (!stats) return false;

      if (f.metric === "score") {
        const val = parseFloat(f.value);
        if (isNaN(val)) continue;
        if (f.operator === ">=" && stats.avgExScore < val) return false;
        if (f.operator === "<=" && stats.avgExScore > val) return false;
      } else if (f.metric === "scoreRate") {
        const val = parseFloat(f.value);
        if (isNaN(val)) continue;
        if (f.operator === ">=" && stats.rate < val) return false;
        if (f.operator === "<=" && stats.rate > val) return false;
      } else if (f.metric === "djrank") {
        const idx = RANK_TABLE.findIndex((t) => t.label === f.value);
        if (idx === -1) continue;
        const ratio = stats.rate / 100;
        if (f.operator === ">=") {
          if (ratio < RANK_TABLE[idx].ratio) return false;
        } else {
          const nextThreshold = RANK_TABLE[idx + 1];
          if (nextThreshold && ratio >= nextThreshold.ratio) return false;
        }
      }
    }

    return true;
  });
}
