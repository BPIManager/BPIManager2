import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandleOutcome, ProfileResponse } from "./_shared";
import type { HandlerResult } from "@/types/api";
import type { NextApiRequest } from "next";
import { accessError } from "@/middlewares/api/apiResult";
import { err, ok } from "@/middlewares/api/apiResult";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { profileUpsertSchema } from "@/schemas/profile/upsert";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { upsertStatsPrivacy } from "@/lib/db/domains/arenaPrivacy";
import { upsertUserProfile } from "@/lib/db/orchestrators/userProfileUpsert";
import { userProfileRepo } from "@/lib/db/aggregates/userProfiles/profile";
import { v4 as uuidv4 } from "uuid";

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

async function upsertProfile(
  req: NextApiRequest,
  uid: string,
): Promise<HandlerResult<unknown>> {
  const parsed = profileUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return err(400, parsed.error.issues[0]?.message ?? "Invalid request body");
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
