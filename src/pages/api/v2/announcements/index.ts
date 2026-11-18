import type { NextApiRequest, NextApiResponse } from "next";
import { handleListAnnouncements } from "@/lib/subhandlers/announcements";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

/** GET /api/v2/announcements（未ログインでも取得できる） */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }
  const { result, targetUserId, viewerId } = await handleListAnnouncements(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
