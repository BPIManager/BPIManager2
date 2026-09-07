import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import {
  handleOptimizeMemoList,
  handleCreateOptimizeMemo,
} from "@/lib/subhandlers/bpiOptimizer";
import { writeV1Result } from "@/middlewares/api/apiResult";

const postHandler = withAuth(async (req, res) => {
  const { result } = await handleCreateOptimizeMemo(req);
  writeV1Result(res, result, undefined, 201);
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { result } = await handleOptimizeMemoList(req);
    return writeV1Result(res, result);
  }
  if (req.method === "POST") {
    return postHandler(req, res);
  }
  return res.status(405).end();
}
