import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleGetApiKey,
  handleRegenerateApiKey,
} from "@/lib/subhandlers/auth";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } =
    req.method === "GET"
      ? await handleGetApiKey(req)
      : await handleRegenerateApiKey(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
