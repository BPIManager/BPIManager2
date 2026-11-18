import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleUpdateSavedComparison, handleDeleteSavedComparison } from "@/lib/subhandlers/savedComparisons";
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
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } =
    req.method === "PATCH" ? await handleUpdateSavedComparison(req) : await handleDeleteSavedComparison(req);

  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
