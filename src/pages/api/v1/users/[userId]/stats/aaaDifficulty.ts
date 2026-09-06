import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { aaaDifficultySchema } from "@/schemas/stats/aaaDifficulty";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { handleStatsAaaDifficulty } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseQuery(aaaDifficultySchema, req.query, res);
  if (!body) return;

  if (body.userId && body.userId !== "guest") {
    const access = await checkUserAccess(req, body.userId);
    if (!access.hasAccess) return rejectAccess(res, access);
  }

  writeV1Result(res, await handleStatsAaaDifficulty(body));
}
