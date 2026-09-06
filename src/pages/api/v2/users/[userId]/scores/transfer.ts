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
} from "@/middlewares/api/apiResult";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }

  const { result, targetUserId, viewerId } = await handleScoresTransfer(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
};

export default withAuth(handler);
