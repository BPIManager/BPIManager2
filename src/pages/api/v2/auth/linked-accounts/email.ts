import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleRequestEmailLink } from "@/lib/subhandlers/auth";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";

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

export default withAuth(handler);
