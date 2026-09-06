import type { NextApiRequest, NextApiResponse } from "next";
import { handleBatchScores } from "@/lib/subhandlers/batches";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end();
    return;
  }

  const { result, targetUserId, viewerId } = await handleBatchScores(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
