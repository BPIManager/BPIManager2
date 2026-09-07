import type { NextApiRequest, NextApiResponse } from "next";
import { handleSongRanking } from "@/lib/subhandlers/songs";
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
  const { result, targetUserId, viewerId } = await handleSongRanking(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
