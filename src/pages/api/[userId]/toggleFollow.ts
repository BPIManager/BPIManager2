import { NextApiRequest, NextApiResponse } from "next";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { followsRepo } from "@/lib/db/follow";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId: targetUserId } = req.query;

  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ error: "Missing target userId" });
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);

    if (!access.viewerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const myId = access.viewerId;

    if (myId === targetUserId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const isFollowed = await followsRepo.toggleFollow(myId, targetUserId);

    return res.status(200).json({
      success: true,
      isFollowing: isFollowed,
      message: isFollowed ? "Followed" : "Unfollowed",
    });
  } catch (error) {
    console.error("Follow Toggle API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
