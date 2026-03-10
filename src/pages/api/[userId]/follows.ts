import { NextApiRequest, NextApiResponse } from "next";
import { FollowRepository } from "@/lib/db/follow";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, type, page, limit } = req.query;

  if (!userId || typeof userId !== "string")
    return res.status(400).json({ error: "Invalid userId" });
  if (type !== "following" && type !== "followers")
    return res.status(400).json({ error: "Invalid type" });

  const pageNum = Math.max(1, Number(page || 1));
  const limitNum = Math.min(100, Math.max(1, Number(limit || 20)));

  try {
    const access = await checkProfileAccess(req, userId);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const repo = new FollowRepository();
    const result = await repo.getFollowList({
      targetUserId: userId,
      viewerId: access.viewerId,
      type,
      page: pageNum,
      limit: limitNum,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(`Follow List API Error (${type}):`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
