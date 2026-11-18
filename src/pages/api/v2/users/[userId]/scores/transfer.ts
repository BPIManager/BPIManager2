import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleScoresTransfer } from "@/lib/subhandlers/scores";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } = await handleScoresTransfer(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
};

export default withAuth(handler);
