import { NextApiRequest, NextApiResponse } from "next";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { usersRepo } from "@/lib/db/domains/users";
import { followsRepo } from "@/lib/db/domains/follow";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { authenticateViewer } from "@/middlewares/api/withApi";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

/**
 * 招待URL(`/invite/[token]`)共通の解決エンドポイント。
 *
 * トークンから招待の種別と表示用最小情報を取得する公開エンドポイント
 * （トークン自体が秘密情報のため認証は不要）。フォロー招待・チーム招待
 * （#276で追加予定）等、複数の招待種別が同じ`/invite/[token]`URL形式を
 * 共有するため、`type`で種別を判別できるレスポンス形式にしている。
 * 現時点では`followInviteLinks`のみ解決対象。
 *
 * フォロー招待の場合、認証済みなら`isFollowing`（既に承認済みか）・
 * `hasPendingRequest`（保留中リクエスト送信済みか）も返し、招待ページが
 * 「送信」ボタンではなく「承認済み」「取り下げる」の状態を最初から
 * 出し分けられるようにする。
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Invalid token" });
  }

  try {
    const followInvite = await followInviteLinksRepo.getByToken(token);
    if (followInvite) {
      const inviter = await usersRepo.getDisplayInfo(followInvite.userId);
      if (!inviter) {
        return res.status(404).json({ message: "User not found" });
      }

      const viewerId = await authenticateViewer(req);
      let isFollowing = false;
      let hasPendingRequest = false;
      if (viewerId && viewerId !== inviter.userId) {
        // 対象が公開の場合は通常のfollows存在のみで判定する(公開時代の
        // インスタントフォローには承認記録がないため)。非公開の場合は
        // 承認記録も要求する(#275フォロー後方修正: 公開→非公開に変わった
        // ユーザーの未承認フォロワーを「承認済み」扱いにしないため)
        [isFollowing, hasPendingRequest] = await Promise.all([
          inviter.isPublic
            ? followsRepo.isFollowing(viewerId, inviter.userId)
            : followAccessAggregateRepo.hasApprovedFollowAccess(
                viewerId,
                inviter.userId,
              ),
          followRequestsRepo.existsPending(viewerId, inviter.userId),
        ]);
      }

      return res.status(200).json({
        type: "follow" as const,
        userId: inviter.userId,
        userName: inviter.userName,
        profileImage: inviter.profileImage,
        isFollowing,
        hasPendingRequest,
      });
    }

    return res.status(404).json({ message: "Invalid invite link" });
  } catch (error) {
    console.error("Invite Resolve API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// 認証不要の公開エンドポイントのため、トークン試行によるDB負荷を抑える
export default withRateLimit(handler, { windowMs: 60_000, max: 30 });
