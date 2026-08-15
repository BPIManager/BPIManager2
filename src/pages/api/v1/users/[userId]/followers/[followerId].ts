import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followsRepo } from "@/lib/db/domains/follow";
import { unfollowAndCleanupLists } from "@/lib/db/orchestrators/unfollow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";

/**
 * 指定フォロワーの強制フォロー解除(DELETE)・事後承認(POST)。
 *
 * POSTは、承認記録を持たない既存フォロワー(承認制導入前、自分が公開
 * だった時代に成立したフォロー。通知ベルの「承認待ち」タブに`kind:
 * "legacy"`として表示される)を事後承認する。`follows`行は既に存在する
 * ため作成せず、承認記録(`followApprovalNotifications`)のみ追加する。
 *
 * 恒久的なブロックではないため、DELETE後も相手は招待URLがあれば
 * 再度リクエストを送信できる。ルートに`userId`パラメータを持つため
 * `withAuth`が自動的に本人確認を行う（本人のみ操作可能。`followerId`は
 * 操作対象で本人確認の対象外）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  const { followerId } = req.query;
  if (!followerId || typeof followerId !== "string") {
    return res.status(400).json({ message: "Invalid followerId" });
  }

  try {
    switch (req.method) {
      case "DELETE": {
        // followsRepo.removeではなく専用オーケストレーターを使う理由は、
        // 解除された相手(req.authUid)をfollowerId本人の全リストからも
        // 同一トランザクションで外す(#277)必要があるため
        const removed = await unfollowAndCleanupLists(
          followerId,
          req.authUid,
        );
        if (!removed) {
          return res.status(404).json({ message: "Follower not found" });
        }
        return res.status(200).json({ status: "removed" });
      }

      case "POST": {
        const isFollowing = await followsRepo.isFollowing(
          followerId,
          req.authUid,
        );
        if (!isFollowing) {
          return res.status(404).json({ message: "Follower not found" });
        }
        await followApprovalNotificationsRepo.recordApproval(
          followerId,
          req.authUid,
        );
        // 招待URL再送信等で同じ相手の本物のfollowRequests行が並行して
        // 存在する場合、事後承認後に迷子の保留リクエストとして残さない
        await followRequestsRepo.withdraw(followerId, req.authUid);
        return res.status(200).json({ status: "approved" });
      }

      default:
        res.setHeader("Allow", ["POST", "DELETE"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Follower Action API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
