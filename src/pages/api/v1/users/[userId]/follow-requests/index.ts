import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followRequestsAggregateRepo } from "@/lib/db/aggregates/followRequests";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";

/**
 * 自分宛の「承認待ち」一覧を取得する。
 *
 * 招待URL経由の本物のフォローリクエスト(`kind: "request"`)と、承認記録を
 * 持たない既存フォロワー(`kind: "legacy"`。承認制導入前、自分が公開だった
 * 時代に成立したフォロー)を統合し、送信/フォロー日時の昇順で返す。
 * `legacy`エントリは実際の`followRequests`行を持たない(動的導出のみ)。
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
    const [pendingRequests, unapprovedFollowers] = await Promise.all([
      followRequestsAggregateRepo.listPendingForTarget(req.authUid),
      followAccessAggregateRepo.listUnapprovedFollowers(req.authUid),
    ]);

    const requesterIdsWithRealRequest = new Set(
      pendingRequests.map((r) => r.requesterId),
    );

    const requests = [
      ...pendingRequests.map((r) => ({
        kind: "request" as const,
        id: r.id,
        requesterId: r.requesterId,
        requesterName: r.requesterName,
        requesterImage: r.requesterImage,
        createdAt: r.createdAt,
      })),
      // 招待URL再送信によりlegacyフォロワーが正規のリクエストを送信済みの
      // 場合、同じ相手が両方に重複して並ばないよう"request"側を優先する
      ...unapprovedFollowers
        .filter((f) => !requesterIdsWithRealRequest.has(f.followerId))
        .map((f) => ({
          kind: "legacy" as const,
          requesterId: f.followerId,
          requesterName: f.followerName,
          requesterImage: f.followerImage,
          createdAt: f.createdAt,
        })),
    ].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Follow Requests List API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
