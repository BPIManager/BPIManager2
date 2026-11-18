import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleNewBpiPlayers } from "@/lib/subhandlers/newBpiPlayers";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }
  const { result, targetUserId, viewerId } = await handleNewBpiPlayers(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
