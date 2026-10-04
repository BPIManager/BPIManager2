import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleMarkAnnouncementsRead } from "@/lib/subhandlers/announcements";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";

/** POST /api/v2/announcements/read（表示中のお知らせをまとめて既読にする） */
async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } = await handleMarkAnnouncementsRead(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
