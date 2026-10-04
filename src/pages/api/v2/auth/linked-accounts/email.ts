import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleRequestEmailLink } from "@/lib/subhandlers/auth";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

/** POST /api/v2/auth/linked-accounts/email（メールアドレスの追加・変更の確認メール送信） */
async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } = await handleRequestEmailLink(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

/** IP 単位で 10 分に 10 回まで（確認メールの濫用防止） */
export default withRateLimit(withAuth(handler, { rejectApiKeySession: true }), { windowMs: 10 * 60_000, max: 10 });
