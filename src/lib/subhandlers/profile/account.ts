import type { HandleOutcome } from "./_shared";
import type { NextApiRequest } from "next";
import { accountDeletionSchema } from "@/schemas/account/deletion";
import { adminAuth } from "@/lib/firebase/admin";
import { backupAndDeleteUser } from "@/lib/db/orchestrators/userDeletion";
import { err, ok } from "@/middlewares/api/apiResult";
import { usersRepo } from "@/lib/db/domains/users";
export async function deleteAccount(
  req: NextApiRequest,
  uid: string,
): Promise<HandleOutcome<{ message: string }>> {
  const base = { targetUserId: uid, viewerId: uid };

  const parsed = accountDeletionSchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      ...base,
    };
  }

  const userName = await usersRepo.getUserName(uid);
  if (userName === null) {
    // DB削除は済んだが Firebase 削除が失敗して再試行されたケース。DBには無いが認証は
    // 残っているため、認証側の削除だけを完了させる（呼び出し元は本人のトークンで認証済み）
    return await deleteAuthOnly(uid, base);
  }
  if (parsed.data.confirmUserName !== userName) {
    return {
      result: err(400, "ユーザー名が一致しません。入力を確認してください。"),
      ...base,
    };
  }

  try {
    // DBデータをバックアップ後、全テーブルから物理削除
    await backupAndDeleteUser(uid);
    // Firebase Authentication からも削除
    await adminAuth.deleteUser(uid);
    return { result: ok({ message: "アカウントを削除しました" }), ...base };
  } catch (error) {
    console.error("Account deletion error:", error);
    return {
      result: err(500, "アカウントの削除に失敗しました"),
      ...base,
    };
  }
}

async function deleteAuthOnly(
  uid: string,
  base: { targetUserId: string; viewerId: string },
): Promise<HandleOutcome<{ message: string }>> {
  try {
    await adminAuth.deleteUser(uid);
    return { result: ok({ message: "アカウントを削除しました" }), ...base };
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "auth/user-not-found") {
      return { result: err(404, "User not found"), ...base };
    }
    console.error("Account deletion error:", error);
    return {
      result: err(500, "アカウントの削除に失敗しました"),
      ...base,
    };
  }
}
