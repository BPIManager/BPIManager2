import type { NextApiRequest, NextApiResponse } from "next";
import { handleSongPatternSearch } from "@/lib/subhandlers/songs";
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
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }
  const { result, targetUserId, viewerId } = await handleSongPatternSearch(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
