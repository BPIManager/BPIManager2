import { BpiCalculator } from "@/lib/bpi";
import topElements from "@/constants/radars/topElements.json";
import {
  RadarCategory,
  RadarResponse,
  RadarSongEntry,
} from "@/types/stats/radar";

export const ALL_CATEGORIES: RadarCategory[] = [
  "NOTES",
  "CHORD",
  "PEAK",
  "CHARGE",
  "SCRATCH",
  "SOFLAN",
];

const topElementMap = new Map<string, RadarCategory>(
  (topElements as any[]).map((e) => [`${e.title}___${e.difficulty}`, e.top]),
);

export function calculateRadar(scores: any[]): RadarResponse {
  const categoryGroup = new Map<RadarCategory, any[]>();
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

    const totalCountInMaster = (topElements as any[]).filter(
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
