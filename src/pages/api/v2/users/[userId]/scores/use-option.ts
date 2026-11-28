import type { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedNextApiRequest,
} from "@/middlewares/api/withAuth";
import { handleScoreUseOption } from "@/lib/subhandlers/scores";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

/** PATCH /users/[userId]/scores/use-option （本人のみ）: 記録の使用オプションを更新する */
const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "PATCH") {
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } = await handleScoreUseOption(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
};

export default withAuth(handler);
