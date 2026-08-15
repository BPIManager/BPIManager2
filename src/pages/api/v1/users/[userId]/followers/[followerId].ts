import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followsRepo } from "@/lib/db/domains/follow";

/**
 * 指定フォロワーを強制的にフォロー解除する（「強制フォロー解除」）。
 *
 * 恒久的なブロックではないため、相手は招待URLがあれば再度リクエストを
 * 送信できる。ルートに`userId`パラメータを持つため`withAuth`が自動的に
 * 本人確認を行う（本人のみ操作可能。`followerId`は削除対象で本人確認の
 * 対象外）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { followerId } = req.query;
  if (!followerId || typeof followerId !== "string") {
    return res.status(400).json({ message: "Invalid followerId" });
  }

  try {
    const removed = await followsRepo.remove(followerId, req.authUid);
    if (!removed) {
      return res.status(404).json({ message: "Follower not found" });
    }
    return res.status(200).json({ status: "removed" });
  } catch (error) {
    console.error("Force Unfollow API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
