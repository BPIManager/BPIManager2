import type { NextApiRequest, NextApiResponse } from "next";
import { handleSongPatternSearch } from "@/lib/subhandlers/songs";
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
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } = await handleSongPatternSearch(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
