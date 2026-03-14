import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";
import { calculateRadar } from "@/lib/radar/calculator";
import { statsRepo } from "@/lib/db/stats";

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
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const scores = await statsRepo.getLatestScoresWithMusicData(
      String(userId),
      String(version),
      levels,
      difficulties,
    );

    const result = calculateRadar(scores);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Radar API Error:", error);
    return res.status(500).json({ message: error.message });
  }
}
