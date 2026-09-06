import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import { handleDeleteOptimizeMemo } from "@/lib/subhandlers/bpiOptimizer";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

const deleteHandler = withAuth(async (req, res) => {
  const { result, targetUserId, viewerId } =
    await handleDeleteOptimizeMemo(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    return deleteHandler(req, res);
  }
  return res.status(405).end();
}
