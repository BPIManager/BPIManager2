import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleBatchDetail,
  handleBatchDelete,
} from "@/lib/subhandlers/batches";
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
  if (req.method !== "GET" && req.method !== "DELETE") {
    res.setHeader("Allow", ["GET", "DELETE"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }

  const { result, targetUserId, viewerId } =
    req.method === "DELETE"
      ? await handleBatchDelete(req)
      : await handleBatchDetail(req);

  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
