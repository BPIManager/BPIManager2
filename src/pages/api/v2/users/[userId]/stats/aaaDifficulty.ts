import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { aaaDifficultySchema } from "@/schemas/stats/aaaDifficulty";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { handleStatsAaaDifficulty } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseQuery(aaaDifficultySchema, req.query, res);
  if (!body) return;

  let viewerId: string | null = null;
  if (body.userId && body.userId !== "guest") {
    const access = await checkUserAccess(req, body.userId);
    if (!access.hasAccess) {
      writeV2Result(res, accessError(access)!);
      return;
    }
    viewerId = access.viewerId ?? null;
  }

  writeV2Result(
    res,
    withMeta(
      await handleStatsAaaDifficulty(body),
      buildMeta(viewerId, body.userId),
    ),
  );
}
