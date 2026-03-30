import { db } from "@/lib/db";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { backupAndDeleteUser } from "@/lib/db/users/deletion";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const userId = req.authUid;
  const { confirmUserName } = req.body as { confirmUserName: string };

  if (!confirmUserName) {
    return res.status(400).json({ message: "confirmUserName is required" });
  }

  // ユーザー存在確認とユーザー名照合
  const user = await db
    .selectFrom("users")
    .select(["userId", "userName"])
    .where("userId", "=", userId)
    .executeTakeFirst();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (confirmUserName !== user.userName) {
    return res
      .status(400)
      .json({ message: "ユーザー名が一致しません。入力を確認してください。" });
  }

  try {
    // DBデータをバックアップ後、全テーブルから物理削除
    await backupAndDeleteUser(userId);

    // Firebase Authenticationからも削除
    await adminAuth.deleteUser(userId);

    return res.status(200).json({ message: "アカウントを削除しました" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({ message: "アカウントの削除に失敗しました" });
  }
};

export default withAuth(handler);
