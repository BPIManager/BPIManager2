import type { NextApiRequest, NextApiResponse } from "next";
import { handleSongPatternVote } from "@/lib/subhandlers/songs";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } = await handleSongPatternVote(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
