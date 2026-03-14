import { latestVersion } from "@/constants/latestVersion";
import { validateUserName } from "@/utils/common/nameValidation";
import { NextApiRequest, NextApiResponse } from "next";
import { socialRepo } from "../db/social";
import { usersRepo } from "../db/users";
import { v4 as uuidv4 } from "uuid";

export async function handleGetProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
  access: any,
  isCompare: boolean,
) {
  if (!access.hasAccess)
    return res
      .status(access.error!.status)
      .json({ message: access.error!.message });

  const viewerId = access.viewerId;
  const version = latestVersion;

  const [profile, winLoss, radar] = await Promise.all([
    usersRepo.getUserProfileSummary(uid, viewerId),
    isCompare && viewerId
      ? socialRepo.getWinLossStats(viewerId, uid, version)
      : null,
    isCompare ? socialRepo.getUserRadar(uid, version) : null,
  ]);

  if (!profile) return res.status(404).json({ message: "User not found" });

  if (
    profile.isPublic !== 1 &&
    viewerId !== uid &&
    !profile.relationship?.isFollowing
  ) {
    return res.status(403).json({ message: "This profile is private" });
  }

  const response: any = { profile };
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
  return res.status(200).json(response);
}

export async function handleCreateProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
) {
  const existing = await usersRepo.getUserProfileSummary(uid);
  if (existing)
    return res
      .status(409)
      .json({ message: "Profile already exists. Use PATCH to update." });

  return await upsert(req, res, uid);
}

export async function handleUpdateProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
) {
  const existing = await usersRepo.getUserProfileSummary(uid);
  if (!existing)
    return res
      .status(404)
      .json({ message: "Profile not found. Use POST to create." });

  return await upsert(req, res, uid);
}

export async function upsert(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
) {
  const data = req.body;
  const validation = validateUserName(data.userName);
  if (!validation.isValid)
    return res.status(400).json({ message: validation.message });

  const result = await usersRepo.upsertUserProfile({
    ...data,
    userId: uid,
    version: latestVersion,
    batchId: uuidv4(),
  });
  return res.status(200).json(result);
}
