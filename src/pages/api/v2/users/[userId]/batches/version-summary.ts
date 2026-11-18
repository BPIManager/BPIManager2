import type { NextApiRequest, NextApiResponse } from "next";
import { handleVersionSummary } from "@/lib/subhandlers/batches";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } = await handleVersionSummary(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
