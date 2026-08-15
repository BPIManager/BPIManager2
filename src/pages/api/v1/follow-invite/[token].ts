import { NextApiRequest, NextApiResponse } from "next";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { usersRepo } from "@/lib/db/domains/users";

/**
 * 招待URLのトークンから、招待発行者の表示用最小情報を取得する。
 *
 * 招待ページ(`/invite/[token]`)がログイン前に「誰からの招待か」を表示する
 * ために使う公開エンドポイント（トークン自体が秘密情報のため認証は不要）。
 */
export default async function handler(
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
    const invite = await followInviteLinksRepo.getByToken(token);
    if (!invite) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    const inviter = await usersRepo.getDisplayInfo(invite.userId);
    if (!inviter) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      userId: inviter.userId,
      userName: inviter.userName,
      profileImage: inviter.profileImage,
    });
  } catch (error) {
    console.error("Follow Invite Preview API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
