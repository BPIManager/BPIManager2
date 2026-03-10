import { StatsRepository } from "@/lib/db/stats";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";
import topElements from "@/constants/radars/topElements.json";
import { BpiCalculator } from "@/lib/bpi";
import {
  RadarCategory,
  RadarCategoryResult,
  RadarSongEntry,
} from "@/types/stats/radar";

interface TopElement {
  title: string;
  difficulty: string;
  top: RadarCategory;
}

const topElementMap = new Map<string, RadarCategory>(
  (topElements as TopElement[]).map((e) => [
    `${e.title}___${e.difficulty}`,
    e.top,
  ]),
);

const ALL_CATEGORIES: RadarCategory[] = [
  "NOTES",
  "CHORD",
  "PEAK",
  "CHARGE",
  "SCRATCH",
  "SOFLAN",
];

type RadarResponse = {
  [K in RadarCategory]: RadarCategoryResult;
};

const ensureArray = (query: string | string[] | undefined): string[] => {
  if (!query) return [];
  return Array.isArray(query) ? query : [query];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, version, level, difficulty } = req.query;
  const levels = ensureArray(level).map(Number);
  const difficulties = ensureArray(difficulty);

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });

    const repo = new StatsRepository();

    const scores = await repo.getLatestScoresWithMusicData(
      String(userId),
      String(version),
      levels,
      difficulties,
    );

    const categoryScores = new Map<RadarCategory, number[]>();
    ALL_CATEGORIES.forEach((cat) => categoryScores.set(cat, []));

    for (const score of scores) {
      const key = `${score.title}___${score.difficulty}`;
      const category = topElementMap.get(key);
      if (category) {
        categoryScores.get(category)!.push(Number(score.bpi ?? -15));
      }
    }

    const result = {} as RadarResponse;

    for (const category of ALL_CATEGORIES) {
      const bpiList = categoryScores.get(category)!;

      let totalCount = (topElements as TopElement[]).filter(
        (e) => e.top === category,
      ).length;

      const effectiveTotalCount = Math.max(totalCount, bpiList.length);

      const sortedBpis = bpiList.sort((a, b) => b - a);

      result[category] = {
        totalBpi:
          effectiveTotalCount > 0
            ? BpiCalculator.calculateTotalBPI(sortedBpis, effectiveTotalCount)
            : -15,
        songs: scores
          .filter(
            (s) =>
              topElementMap.get(`${s.title}___${s.difficulty}`) === category,
          )
          .map((s) => ({
            title: s.title,
            difficulty: s.difficulty ?? "",
            exScore: s.exScore,
            bpi: Number(s.bpi ?? -15),
          }))
          .sort((a, b) => b.bpi - a.bpi),
      };
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
