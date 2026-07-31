import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { withAuth } from "@/middlewares/api/withAuth";
import { NextApiRequest, NextApiResponse } from "next";

const deleteHandler = withAuth(async (req, res) => {
  const uid = req.authUid;
  const rid = String(req.query.memoId);

  const success = await bpiOptimizerRepo.deleteMemo(uid, rid);
  if (!success) return res.status(404).json({ message: "Memo not found" });
  res.status(204).end();
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
