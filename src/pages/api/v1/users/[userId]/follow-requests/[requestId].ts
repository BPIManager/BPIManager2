import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { approveFollowRequest } from "@/lib/db/orchestrators/followRequestApproval";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";

/**
 * 保留中フォローリクエストの承認(POST)・却下(DELETE)。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （リクエスト先本人のみ操作可能）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  const { requestId } = req.query;
  const id = Number(requestId);
  if (!requestId || Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid requestId" });
  }

  try {
    switch (req.method) {
      case "POST": {
        const requesterId = await approveFollowRequest(id, req.authUid);
        if (!requesterId) {
          return res.status(404).json({ message: "Request not found" });
        }
        return res.status(200).json({ status: "approved", requesterId });
      }

      case "DELETE": {
        const rejected = await followRequestsRepo.reject(id, req.authUid);
        if (!rejected) {
          return res.status(404).json({ message: "Request not found" });
        }
        return res.status(200).json({ status: "rejected" });
      }

      default:
        res.setHeader("Allow", ["POST", "DELETE"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Follow Request Action API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
