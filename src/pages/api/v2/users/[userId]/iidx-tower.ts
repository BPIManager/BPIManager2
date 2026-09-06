import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import {
  handleIidxTowerGet,
  handleIidxTowerPost,
} from "@/lib/subhandlers/iidxTower";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

const postHandler = withAuth(async (req, res) => {
  const { result, targetUserId, viewerId } = await handleIidxTowerPost(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { result, targetUserId, viewerId } = await handleIidxTowerGet(req);
    return writeV2Result(
      res,
      withMeta(result, buildMeta(viewerId, targetUserId)),
    );
  }
  if (req.method === "POST") {
    return postHandler(req, res);
  }
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
