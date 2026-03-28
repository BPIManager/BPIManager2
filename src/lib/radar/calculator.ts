import { BpiCalculator } from "@/lib/bpi";
import topElements from "@/constants/radars/topElements.json";
import {
  RadarCategory,
  RadarResponse,
  RadarSongEntry,
} from "@/types/stats/radar";

/**
 * レーダーチャートで使用する全カテゴリの一覧。
 * 各楽曲は `topElements.json` によっていずれか 1 つのカテゴリに分類される。
 */
export const ALL_CATEGORIES: RadarCategory[] = [
  "NOTES",
  "CHORD",
  "PEAK",
  "CHARGE",
  "SCRATCH",
  "SOFLAN",
];

interface TopElement {
  title: string;
  difficulty: string;
  top: RadarCategory;
}

interface RadarScoreInput {
  title: string;
  difficulty: string | null;
  exScore: number;
  bpi: number | string | null;
}

const topElementMap = new Map<string, RadarCategory>(
  (topElements as TopElement[]).map((e) => [
    `${e.title}___${e.difficulty}`,
    e.top,
  ]),
);

/**
 * スコアリストからレーダーチャートデータを計算する。
 *
 * `topElements.json` を参照して各楽曲をカテゴリに分類し、
 * カテゴリごとに {@link BpiCalculator.calculateTotalBPI} を適用した総合 BPI を算出する。
 *
 * @param scores - 計算対象のスコア配列（タイトル・難易度・EX スコア・BPI）
 * @returns 6 カテゴリそれぞれの総合 BPI と楽曲リストを含むレーダーデータ
 */
export function calculateRadar(scores: RadarScoreInput[]): RadarResponse {
  const categoryGroup = new Map<RadarCategory, RadarScoreInput[]>();
  ALL_CATEGORIES.forEach((cat) => categoryGroup.set(cat, []));

  for (const score of scores) {
    const key = `${score.title}___${score.difficulty}`;
    const category = topElementMap.get(key);
    if (category) {
      categoryGroup.get(category)!.push(score);
    }
  }

  const result = {} as RadarResponse;

  for (const category of ALL_CATEGORIES) {
    const categoryScores = categoryGroup.get(category)!;

    const totalCountInMaster = (topElements as TopElement[]).filter(
      (e) => e.top === category,
    ).length;

    const bpiList = categoryScores
      .map((s) => Number(s.bpi ?? -15))
      .sort((a, b) => b - a);

    const effectiveTotalCount = Math.max(totalCountInMaster, bpiList.length);

    result[category] = {
      totalBpi:
        effectiveTotalCount > 0
          ? BpiCalculator.calculateTotalBPI(bpiList, effectiveTotalCount)
          : -15,
      songs: categoryScores
        .map(
          (s): RadarSongEntry => ({
            title: s.title,
            difficulty: s.difficulty ?? "",
            exScore: s.exScore,
            bpi: Number(s.bpi ?? -15),
          }),
        )
        .sort((a, b) => b.bpi - a.bpi),
    };
  }

  return result;
}
