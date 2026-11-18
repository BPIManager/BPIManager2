import type { NextApiRequest, NextApiResponse } from "next";
import { handleResolveInvite } from "@/lib/subhandlers/auth";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }
  const { result, targetUserId, viewerId } = await handleResolveInvite(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withRateLimit(handler, { windowMs: 60_000, max: 30 });
