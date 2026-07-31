import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { withAuth } from "@/middlewares/api/withAuth";
import { NextApiRequest, NextApiResponse } from "next";
import { createOptimizeMemoBodySchema } from "@/schemas/optimizeMemo/create";
import { parseBody } from "@/services/nextRequest/parseBody";

const postHandler = withAuth(async (req, res) => {
  const uid = req.authUid;

  const body = parseBody(createOptimizeMemoBodySchema, req.body, res);
  if (!body) return;
  const { targetBpi, reportData } = body;
  const reportId = await bpiOptimizerRepo.saveMemo(uid, targetBpi, reportData);
  return res.status(201).json({ reportId });
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { userId } = req.query;
    const uid = String(userId);

    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess) return rejectAccess(res, access);

    const memos = await bpiOptimizerRepo.getMemosByUserId(uid);
    return res.status(200).json(memos);
  }

  if (req.method === "POST") {
    return postHandler(req, res);
  }

  return res.status(405).end();
}
