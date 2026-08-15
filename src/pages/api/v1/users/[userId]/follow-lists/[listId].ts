import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { updateFollowListBodySchema } from "@/schemas/followLists/update";
import { parseBody } from "@/services/nextRequest/parseBody";

/**
 * フォローリストの改名・公開設定変更(PATCH)・削除(DELETE)。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （本人のみアクセス可能）。加えて`listId`自体の所有者が`userId`と一致する
 * かは各リポジトリメソッド側で確認する。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  const { listId } = req.query;
  const id = Number(listId);
  if (!listId || Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid listId" });
  }

  const userId = req.authUid;

  try {
    switch (req.method) {
      case "PATCH": {
        const body = parseBody(updateFollowListBodySchema, req.body, res);
        if (!body) return;

        const updated = await followListsRepo.update(id, userId, {
          name: body.name,
          isPublic: body.isPublic,
        });
        if (!updated) {
          return res.status(404).json({ message: "List not found" });
        }
        return res.status(200).json({ status: "updated" });
      }

      case "DELETE": {
        const removed = await followListsRepo.remove(id, userId);
        if (!removed) {
          return res.status(404).json({ message: "List not found" });
        }
        return res.status(200).json({ status: "deleted" });
      }

      default:
        res.setHeader("Allow", ["PATCH", "DELETE"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Follow List Detail API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
