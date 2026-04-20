import type { NextApiRequest, NextApiResponse } from "next";
import { iidxTowerRepo } from "@/lib/db/iidxTower";
import {
  checkProfileAccess,
  authenticateViewer,
} from "@/middlewares/api/withApiOnProfile";
import { adminAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const towerRowSchema = z.object({
  playDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keyCount: z.number().int().nonnegative(),
  scratchCount: z.number().int().nonnegative(),
});

const postBodySchema = z.object({
  version: z.string().min(1).max(50),
  rows: z.array(towerRowSchema).min(1).max(1000),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const targetUserId = req.query.userId as string;

  if (req.method === "GET") {
    const access = await checkProfileAccess(req, targetUserId);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;
    const compare = req.query.compare === "true";

    const targetData = await iidxTowerRepo.getByUser(targetUserId, version);

    if (!compare) {
      return res.status(200).json(targetData);
    }

    const viewerId = access.viewerId;
    if (!viewerId) {
      return res
        .status(401)
        .json({ message: "Authentication required for compare mode." });
    }

    const selfData =
      viewerId === targetUserId
        ? targetData
        : await iidxTowerRepo.getByUser(viewerId, version);

    return res.status(200).json({ target: targetData, self: selfData });
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
      if (decodedToken.uid !== targetUserId) {
        return res.status(403).json({ message: "Forbidden: User ID mismatch" });
      }
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const parsed = postBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request body" });
    }
    const { version, rows } = parsed.data;
    const count = await iidxTowerRepo.upsertRows(targetUserId, version, rows);
    return res.status(200).json({ success: true, upsertedCount: count });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
