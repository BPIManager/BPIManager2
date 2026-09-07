import type { HandleOutcome } from "./_shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { userProfileRepo } from "@/lib/db/aggregates/userProfiles/profile";
export async function getMe(
  uid: string,
): Promise<HandleOutcome<{ exists: boolean; user: unknown }>> {
  try {
    const user = await userProfileRepo.getMe(uid, latestVersion);
    return {
      result: ok({ exists: !!user, user }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      result: err(500, "Internal Server Error"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** DELETE /users/[userId]/account */
