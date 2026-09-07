import { v4 as uuidv4 } from "uuid";
import type { NextApiRequest } from "next";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { adminAuth } from "@/lib/firebase/admin";
import { upsertStatsPrivacy } from "@/lib/db/domains/arenaPrivacy";
import { userProfileRepo } from "@/lib/db/aggregates/userProfiles/profile";
import { usersRepo } from "@/lib/db/domains/users";
import { backupAndDeleteUser } from "@/lib/db/orchestrators/userDeletion";
import { upsertUserProfile } from "@/lib/db/orchestrators/userProfileUpsert";
import { accountDeletionSchema } from "@/schemas/account/deletion";
import { profileUpsertSchema } from "@/schemas/profile/upsert";
import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { HandleOutcome } from "./_shared";

async function upsertProfile(
  req: NextApiRequest,
  uid: string,
): Promise<HandlerResult<unknown>> {
  const parsed = profileUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return err(
      400,
      parsed.error.issues[0]?.message ?? "Invalid request body",
    );
  }

  const { arenaPrivacy, ...profileData } = parsed.data;
  const result = await upsertUserProfile({
    ...profileData,
    userId: uid,
    version: latestVersion,
    batchId: uuidv4(),
  });

  if (arenaPrivacy) {
    await upsertStatsPrivacy(uid, {
      showArenaClass: arenaPrivacy.showArenaClass ? 1 : 0,
      showArenaRank: arenaPrivacy.showArenaRank ? 1 : 0,
      showArea: arenaPrivacy.showArea ? 1 : 0,
      showGrade: arenaPrivacy.showGrade ? 1 : 0,
    });
  }
  return ok(result);
}

/** POST /users/[userId]/profile */
export async function createProfile(
  req: NextApiRequest,
  uid: string,
): Promise<HandleOutcome<unknown>> {
  const existing = await userProfileRepo.getUserProfileSummary(uid);
  const result = existing
    ? err(409, "Profile already exists. Use PATCH to update.")
    : await upsertProfile(req, uid);
  return { result, targetUserId: uid, viewerId: uid };
}

/** PATCH /users/[userId]/profile */
export async function updateProfile(
  req: NextApiRequest,
  uid: string,
): Promise<HandleOutcome<unknown>> {
  const existing = await userProfileRepo.getUserProfileSummary(uid);
  const result = existing
    ? await upsertProfile(req, uid)
    : err(404, "Profile not found. Use POST to create.");
  return { result, targetUserId: uid, viewerId: uid };
}

/** GET /me */

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
    return { result: err(404, "User not found"), ...base };
  }
  if (parsed.data.confirmUserName !== userName) {
    return {
      result: err(
        400,
        "ユーザー名が一致しません。入力を確認してください。",
      ),
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
