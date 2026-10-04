import type { NextApiRequest, NextApiResponse } from "next";
import { handleListAnnouncements } from "@/lib/subhandlers/announcements";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";

/** GET /api/v2/announcements（未ログインでも取得できる） */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } = await handleListAnnouncements(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
