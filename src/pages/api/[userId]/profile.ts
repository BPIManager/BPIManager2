import { NextApiRequest, NextApiResponse } from "next";
import { usersRepo } from "@/lib/db/users";
import { socialRepo } from "@/lib/db/social";
import { latestVersion } from "@/constants/latestVersion";
import { validateUserName } from "@/utils/common/nameValidation";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { v4 as uuidv4 } from "uuid";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId: targetUserId, compare } = req.query;

  const access = await checkProfileAccess(req, targetUserId as string);
  if (req.method === "GET") {
    try {
      if (!access.hasAccess) {
        return res
          .status(access.error!.status)
          .json({ message: access.error!.message });
      }
      const viewerId = access.viewerId;
      if (!viewerId) {
        return res
          .status(404)
          .json({ message: "A viewerId must be specified" });
      }

      const version = latestVersion;

      const [profile, winLoss, radar] = await Promise.all([
        usersRepo.getUserProfileSummary(targetUserId as string, viewerId),
        compare === "true"
          ? socialRepo.getWinLossStats(
              viewerId!,
              targetUserId as string,
              version,
            )
          : null,
        compare === "true"
          ? socialRepo.getUserRadar(targetUserId as string, version)
          : null,
      ]);

      if (!profile) return res.status(404).json({ message: "User not found" });

      if (
        profile.isPublic !== 1 &&
        viewerId !== targetUserId &&
        !profile.relationship?.isFollowing
      ) {
        return res.status(403).json({ message: "This profile is private" });
      }

      const response: any = { profile };
      if (compare === "true") {
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    if (!access.hasAccess || access.viewerId !== targetUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const data = req.body;
    const validation = validateUserName(data.userName);
    if (!validation.isValid)
      return res.status(400).json({ message: validation.message });

    try {
      const result = await usersRepo.upsertUserProfile({
        userId: targetUserId as string,
        userName: data.userName,
        iidxId: data.iidxId,
        profileText: data.profileText,
        profileImage: data.profileImage,
        isPublic: data.isPublic,
        arenaRank: data.arenaRank,
        version: latestVersion,
        batchId: uuidv4(),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res
        .status(error.status || 500)
        .json({ message: "Database Error" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

export default handler;
