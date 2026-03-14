import { followsRepo } from "@/lib/db/follow";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * フォロー・フォロワー一覧の取得
 */
export async function handleGetFollows(
  req: NextApiRequest,
  res: NextApiResponse,
  targetUserId: string,
  viewerId?: string,
) {
  const { type, page, limit } = req.query;

  if (type !== "following" && type !== "followers") {
    return res
      .status(400)
      .json({ error: "Invalid type (following/followers)" });
  }

  const pageNum = Math.max(1, Number(page || 1));
  const limitNum = Math.min(100, Math.max(1, Number(limit || 20)));

  const result = await followsRepo.getFollowList({
    targetUserId,
    viewerId,
    type,
    page: pageNum,
    limit: limitNum,
  });

  return res.status(200).json(result);
}

/**
 * フォローの実行
 */
export async function handlePutFollow(
  res: NextApiResponse,
  targetUserId: string,
  viewerId: string,
) {
  if (viewerId === targetUserId) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const isAlreadyFollowing = await followsRepo.isFollowing(
    viewerId,
    targetUserId,
  );
  if (isAlreadyFollowing) {
    return res
      .status(200)
      .json({ success: true, isFollowing: true, message: "Already followed" });
  }

  const isFollowed = await followsRepo.toggleFollow(viewerId, targetUserId);
  return res
    .status(200)
    .json({ success: true, isFollowing: isFollowed, message: "Followed" });
}

/**
 * フォロー解除の実行
 */
export async function handleDeleteFollow(
  res: NextApiResponse,
  targetUserId: string,
  viewerId: string,
) {
  const isCurrentlyFollowing = await followsRepo.isFollowing(
    viewerId,
    targetUserId,
  );
  if (!isCurrentlyFollowing) {
    return res.status(200).json({
      success: true,
      isFollowing: false,
      message: "Already unfollowed",
    });
  }

  const isFollowed = await followsRepo.toggleFollow(viewerId, targetUserId);
  return res
    .status(200)
    .json({ success: true, isFollowing: isFollowed, message: "Unfollowed" });
}
