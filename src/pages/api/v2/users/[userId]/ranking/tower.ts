import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleTowerRanking } from "@/lib/subhandlers/ranking";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } = await handleTowerRanking(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
