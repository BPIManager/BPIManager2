import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import {
  handleOptimizeMemoList,
  handleCreateOptimizeMemo,
} from "@/lib/subhandlers/bpiOptimizer";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

const postHandler = withAuth(async (req, res) => {
  const { result, targetUserId, viewerId } =
    await handleCreateOptimizeMemo(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { result, targetUserId, viewerId } =
      await handleOptimizeMemoList(req);
    return writeV2Result(
      res,
      withMeta(result, buildMeta(viewerId, targetUserId)),
    );
  }
  if (req.method === "POST") {
    return postHandler(req, res);
  }
  return res.status(405).end();
}
