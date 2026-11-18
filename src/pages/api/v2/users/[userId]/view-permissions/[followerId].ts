import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleRevokeViewPermission } from "@/lib/subhandlers/follows";
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
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } =
    await handleRevokeViewPermission(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
