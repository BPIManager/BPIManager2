import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleFollowsList,
  handleFollow,
  handleUnfollow,
} from "@/lib/subhandlers/follows";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (
    req.method !== "GET" &&
    req.method !== "PUT" &&
    req.method !== "DELETE"
  ) {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } =
    req.method === "GET"
      ? await handleFollowsList(req)
      : req.method === "PUT"
        ? await handleFollow(req)
        : await handleUnfollow(req);

  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
