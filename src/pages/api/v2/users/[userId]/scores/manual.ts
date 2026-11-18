import type { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedNextApiRequest,
} from "@/middlewares/api/withAuth";
import { handleScoreManualUpdate } from "@/lib/subhandlers/scores";
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
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } = await handleScoreManualUpdate(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
};

export default withAuth(handler);
