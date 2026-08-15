import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";

/**
 * 自分が送信したフォローリクエストを取り下げる。
 *
 * ルートパラメータ名を`userId`にしないことで、`withAuth`の自動本人確認
 * （`req.query.userId`と`authUid`の一致チェック）を意図的に働かせない
 * （操作者はリクエスト先本人ではなく送信者自身のため）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { targetUserId } = req.query;
  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ message: "Invalid targetUserId" });
  }

  try {
    const withdrawn = await followRequestsRepo.withdraw(
      req.authUid,
      targetUserId,
    );
    return res.status(200).json({ withdrawn });
  } catch (error) {
    console.error("Follow Request Withdraw API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
