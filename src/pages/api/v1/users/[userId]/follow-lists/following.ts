import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followListsAggregateRepo } from "@/lib/db/aggregates/followLists";

/**
 * フォロー中の全ユーザーを、それぞれが所属するリストID一覧付きで取得する。
 *
 * `/rivals`編集モードの行リスト（ユーザー×所属リストのSelect）用。
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （本人のみアクセス可能。#277: リストは第三者に共有しない前提）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const following = await followListsAggregateRepo.getFollowingWithListMembership(
      req.authUid,
    );
    return res.status(200).json({ following });
  } catch (error) {
    console.error("Follow Lists Following API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
