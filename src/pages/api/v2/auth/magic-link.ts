import type { NextApiRequest, NextApiResponse } from "next";
import { handleSendMagicLink } from "@/lib/subhandlers/auth";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

/** POST /api/v2/auth/magic-link（未ログイン。Turnstile 検証必須） */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }
  const { result, viewerId, targetUserId } = await handleSendMagicLink(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

/** IP 単位で 10 分に 10 回まで（確認メールの濫用防止）。Turnstile とは別の多層防御 */
export default withRateLimit(handler, { windowMs: 10 * 60_000, max: 10 });
