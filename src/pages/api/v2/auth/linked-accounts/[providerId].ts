import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleUnlinkProvider } from "@/lib/subhandlers/auth";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";

/** DELETE /api/v2/auth/linked-accounts/[providerId]（ログイン手段の連携解除） */
async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end();
    return;
  }
  const providerId = String(req.query.providerId);
  const { result, targetUserId, viewerId } = await handleUnlinkProvider(req, providerId);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler, { rejectApiKeySession: true });
