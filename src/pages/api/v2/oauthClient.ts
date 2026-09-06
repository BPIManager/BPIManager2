import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleGetOauthClient,
  handleUpsertOauthClient,
  handleDeleteOauthClient,
} from "@/lib/subhandlers/auth";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (
    req.method !== "GET" &&
    req.method !== "PUT" &&
    req.method !== "DELETE"
  ) {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end();
    return;
  }
  const { result, targetUserId, viewerId } =
    req.method === "GET"
      ? await handleGetOauthClient(req)
      : req.method === "PUT"
        ? await handleUpsertOauthClient(req)
        : await handleDeleteOauthClient(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}

export default withAuth(handler);
