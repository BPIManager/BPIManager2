import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { adminAuth } from "@/lib/firebase/admin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, memoId } = req.query;
  const uid = String(userId);
  const rid = String(memoId);

  if (req.method === "DELETE") {
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

    const success = await bpiOptimizerRepo.deleteMemo(uid, rid);
    if (!success) return res.status(404).json({ message: "Memo not found" });
    return res.status(204).end();
  }

  return res.status(405).end();
}
