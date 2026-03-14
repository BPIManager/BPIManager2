import {
  handleGetFollows,
  handlePutFollow,
  handleDeleteFollow,
} from "@/lib/subhandlers/userId-follow";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId: targetUserId } = req.query;

  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ error: "Invalid or missing userId" });
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const { viewerId } = access;

    switch (req.method) {
      case "GET":
        return await handleGetFollows(req, res, targetUserId, viewerId);

      case "PUT":
        if (!viewerId) return res.status(401).json({ error: "Unauthorized" });
        return await handlePutFollow(res, targetUserId, viewerId);

      case "DELETE":
        if (!viewerId) return res.status(401).json({ error: "Unauthorized" });
        return await handleDeleteFollow(res, targetUserId, viewerId);

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Follow API Error (${req.method}):`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
