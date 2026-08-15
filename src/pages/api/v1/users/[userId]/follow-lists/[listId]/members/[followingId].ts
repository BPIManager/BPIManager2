import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";
import { followsRepo } from "@/lib/db/domains/follow";

/**
 * リストへのユーザー追加(PUT)・削除(DELETE)。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （本人のみ操作可能）。加えて、`listId`が本人所有であること・
 * `followingId`が本人のフォロー中ユーザーであることを確認する
 * （フォローしていない/他人のリストへの追加を防ぐ）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  const { listId, followingId } = req.query;
  const id = Number(listId);
  if (!listId || Number.isNaN(id) || typeof followingId !== "string") {
    return res.status(400).json({ message: "Invalid parameters" });
  }

  const userId = req.authUid;

  try {
    const list = await followListsRepo.getById(id);
    if (!list || list.userId !== userId) {
      return res.status(404).json({ message: "List not found" });
    }

    switch (req.method) {
      case "PUT": {
        const isFollowing = await followsRepo.isFollowing(userId, followingId);
        if (!isFollowing) {
          return res
            .status(400)
            .json({ message: "Not following this user" });
        }
        await followListMembersRepo.addMember(id, followingId);
        return res.status(200).json({ status: "added" });
      }

      case "DELETE": {
        await followListMembersRepo.removeMember(id, followingId);
        return res.status(200).json({ status: "removed" });
      }

      default:
        res.setHeader("Allow", ["PUT", "DELETE"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Follow List Members API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
