import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followRequestsAggregateRepo } from "@/lib/db/aggregates/followRequests";

/**
 * 自分宛の保留中フォローリクエスト一覧を取得する。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （リクエスト先本人のみアクセス可能）。
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
    const requests = await followRequestsAggregateRepo.listPendingForTarget(
      req.authUid,
    );
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Follow Requests List API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
