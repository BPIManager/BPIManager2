import { latestVersion } from "@/constants/iidx/iidxVersions";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { userProfileRepo } from "@/lib/db/aggregates/userProfiles/profile";
import { err, ok } from "@/middlewares/api/apiResult";
import { accessError } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandleOutcome, ProfileResponse } from "./_shared";

export async function getProfile(
  uid: string,
  access: AccessResult,
  isCompare: boolean,
): Promise<HandleOutcome<ProfileResponse>> {
  const viewerId = access.viewerId ?? null;
  const denied = accessError(access);
  if (denied) return { result: denied, targetUserId: uid, viewerId };

  const version = latestVersion;

  const [profile, winLoss, radar] = await Promise.all([
    userProfileRepo.getUserProfileSummary(uid, viewerId ?? undefined),
    isCompare && viewerId
      ? socialComparisonRepo.getWinLossStats(viewerId, uid, version)
      : null,
    isCompare ? socialComparisonRepo.getUserRadar(uid, version) : null,
  ]);

  if (!profile) {
    return { result: err(404, "User not found"), targetUserId: uid, viewerId };
  }

  const isSelf = viewerId === uid;
  const { statsPrivacy, ...profileData } = profile;

  const areaRank =
    isSelf || statsPrivacy?.showArea
      ? getUserAreaRank(profileData.iidxId)
      : null;

  const response: ProfileResponse = { profile: { ...profileData, areaRank } };
  if (isCompare) {
    response.compare = {
      winLoss,
      radar: radar
        ? {
            NOTES: Number(radar.notes),
            CHORD: Number(radar.chord),
            PEAK: Number(radar.peak),
            CHARGE: Number(radar.charge),
            SCRATCH: Number(radar.scratch),
            SOFLAN: Number(radar.soflan),
          }
        : null,
    };
  }
  if (isSelf) {
    response.statsPrivacy = statsPrivacy;
  }
  return { result: ok(response), targetUserId: uid, viewerId };
}


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
