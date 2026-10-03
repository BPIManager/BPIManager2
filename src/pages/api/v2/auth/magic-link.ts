import type { NextApiRequest, NextApiResponse } from "next";
import { handleSendMagicLink } from "@/lib/subhandlers/auth";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";

/** POST /api/v2/auth/magic-link（未ログイン。Turnstile 検証必須） */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }
  const { result, viewerId, targetUserId } = await handleSendMagicLink(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
