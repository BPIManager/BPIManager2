import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { adminAuth } from "@/lib/firebase/admin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;
  const uid = String(userId);

  if (req.method === "GET") {
    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess) return rejectAccess(res, access);

    const memos = await bpiOptimizerRepo.getMemosByUserId(uid);
    return res.status(200).json(memos);
  }

  if (req.method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }
    try {
      const decodedToken = await adminAuth.verifyIdToken(
        authHeader.split("Bearer ")[1],
      );
      if (decodedToken.uid !== uid) {
        return res.status(403).json({ message: "Forbidden: User ID mismatch" });
      }
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

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
