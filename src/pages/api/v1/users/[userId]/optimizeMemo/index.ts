import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;
  const uid = String(userId);

  const access = await checkUserAccess(req, uid);
  if (!access.hasAccess) return rejectAccess(res, access);

  if (req.method === "GET") {
    const memos = await bpiOptimizerRepo.getMemosByUserId(uid);
    return res.status(200).json(memos);
  }

  if (req.method === "POST") {
    const { targetBpi, reportData } = req.body;
    if (targetBpi === undefined || !reportData) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    const reportId = await bpiOptimizerRepo.saveMemo(
      uid,
      targetBpi,
      reportData,
    );
    return res.status(201).json({ reportId });
  }

  return res.status(405).end();
}
