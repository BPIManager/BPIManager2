import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleBatchDetail,
  handleBatchDelete,
} from "@/lib/subhandlers/batches";
import {
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "DELETE") {
    res.setHeader("Allow", ["GET", "DELETE"]);
    res.status(405).end();
    return;
  }

  const { result, targetUserId, viewerId } =
    req.method === "DELETE"
      ? await handleBatchDelete(req)
      : await handleBatchDetail(req);

  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
