import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import {
  singleBPIDistributionParamsSchema,
  VALID_STEPS,
  type ValidStep,
} from "@/schemas/stats/singleBPIDistribution";
import { parseQuery } from "@/services/nextRequest/parseBody";

function buildBuckets(step: ValidStep) {
  const buckets: { label: string; count: number }[] = [];
  buckets.push({ label: "<-10", count: 0 });
  for (let v = -10; v < 100; v += step) {
    buckets.push({ label: v.toString(), count: 0 });
  }
  buckets.push({ label: "100+", count: 0 });
  return buckets;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const query = parseStatsQuery(req.query, res);
  if (!query) return;
  const { userId, version, levels, difficulties } = query;

  const body = parseQuery(singleBPIDistributionParamsSchema, req.query, res);
  if (!body) return;

  const { step } = body;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const scores = await statsRepo.getLatestScoresWithMusicData(
      userId,
      version,
    );

    const distribution = buildBuckets(step);

    scores.forEach((s) => {
      if (!s.exScore || s.exScore <= 0) return;
      if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
        return;
      if (
        difficulties.length > 0 &&
        !difficulties.includes(s.difficulty as string)
      )
        return;

      const bpi = s.bpi ?? -15;
      let idx: number;
      if (bpi < -10) {
        idx = 0;
      } else if (bpi >= 100) {
        idx = distribution.length - 1;
      } else {
        idx = Math.floor((bpi - -10) / step) + 1;
      }

      if (distribution[idx]) distribution[idx].count++;
    });

    return res.status(200).json(distribution);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
