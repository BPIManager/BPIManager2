import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, memoId } = req.query;
  const uid = String(userId);
  const rid = String(memoId);

  const access = await checkUserAccess(req, uid);
  if (!access.hasAccess) return rejectAccess(res, access);

  if (req.method === "DELETE") {
    const success = await bpiOptimizerRepo.deleteMemo(uid, rid);
    if (!success) return res.status(404).json({ message: "Memo not found" });
    return res.status(204).end();
  }

  return res.status(405).end();
}
