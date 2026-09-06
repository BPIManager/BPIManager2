import { handleAllScoresHistory } from "@/lib/subhandlers/allScores";
import {
  buildMeta,
  err,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return writeV2Result(res, err(405, "Method not allowed"));
  }

  const { result, targetUserId, viewerId } = await handleAllScoresHistory(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
