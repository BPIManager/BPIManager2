import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListsAggregateRepo } from "@/lib/db/aggregates/followLists";
import { createFollowListBodySchema } from "@/schemas/followLists/create";
import { parseBody } from "@/services/nextRequest/parseBody";

/**
 * フォローリストの一覧取得(GET)・作成(POST)。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （リスト所有者本人のみアクセス可能。#277: リストは第三者に共有しない前提）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  const userId = req.authUid;

  try {
    switch (req.method) {
      case "GET": {
        const lists = await followListsAggregateRepo.getListsWithMemberCount(
          userId,
        );
        return res.status(200).json({ lists });
      }

      case "POST": {
        const body = parseBody(createFollowListBodySchema, req.body, res);
        if (!body) return;
        const id = await followListsRepo.create(
          userId,
          body.name,
          body.isPublic,
        );
        return res.status(201).json({ id });
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Follow Lists API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
