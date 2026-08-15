import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";

/**
 * 非公開ユーザー向けフォローリクエスト受付用の招待URLトークンを
 * 取得(GET)・発行/再発行(POST)する。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （本人のみ発行・閲覧可能）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  try {
    switch (req.method) {
      case "GET": {
        const link = await followInviteLinksRepo.getByUserId(req.authUid);
        return res.status(200).json({ token: link?.token ?? null });
      }

      case "POST": {
        const token = await followInviteLinksRepo.regenerate(req.authUid);
        return res.status(200).json({ token });
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Follow Invite API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
