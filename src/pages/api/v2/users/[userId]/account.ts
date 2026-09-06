import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { deleteAccount } from "@/lib/subhandlers/profile";
import {
  buildMeta,
  err,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";
import type { NextApiResponse } from "next";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return writeV2Result(res, err(405, "Method Not Allowed"));
  }
  const { result, targetUserId, viewerId } = await deleteAccount(req, req.authUid);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
};

export default withAuth(handler);
