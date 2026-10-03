import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleListLinkedAccounts } from "@/lib/subhandlers/auth";
import { buildMeta, withMeta, writeV2Result } from "@/middlewares/api/apiResult";

/** GET /api/v2/auth/linked-accounts */
async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } = await handleListLinkedAccounts(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
