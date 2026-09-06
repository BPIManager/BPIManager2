import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import { handleDeleteOptimizeMemo } from "@/lib/subhandlers/bpiOptimizer";
import { writeV1Result } from "@/middlewares/api/apiResult";

const deleteHandler = withAuth(async (req, res) => {
  const { result } = await handleDeleteOptimizeMemo(req);
  if (result.ok) {
    res.status(204).end();
    return;
  }
  writeV1Result(res, result);
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
