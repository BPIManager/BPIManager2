import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleFollowListsList,
  handleCreateFollowList,
} from "@/lib/subhandlers/follows";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end();
    return;
  }

  const { result, targetUserId, viewerId } =
    req.method === "GET"
      ? await handleFollowListsList(req)
      : await handleCreateFollowList(req);

  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
