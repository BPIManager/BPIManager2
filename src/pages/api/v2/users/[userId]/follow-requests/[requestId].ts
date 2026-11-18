import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleApproveFollowRequest,
  handleRejectFollowRequest,
} from "@/lib/subhandlers/follows";
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
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } =
    req.method === "POST"
      ? await handleApproveFollowRequest(req)
      : await handleRejectFollowRequest(req);

  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
