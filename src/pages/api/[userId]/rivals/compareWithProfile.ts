import { NextApiRequest, NextApiResponse } from "next";
import { UsersRepository } from "@/lib/db/users";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { latestVersion } from "@/constants/latestVersion";
import { SocialRepository } from "@/lib/db/social";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, rivalId } = req.query;
  if (!rivalId || typeof rivalId !== "string") {
    return res.status(400).json({ message: "rivalId is required" });
  }

  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;
  if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const usersRepo = new UsersRepository();
    const socialRepo = new SocialRepository();
    const version = latestVersion;

    const [profile, winLoss, radar] = await Promise.all([
      usersRepo.getUserProfileSummary(rivalId, viewerId),
      socialRepo.getWinLossStats(viewerId, rivalId, version),
      socialRepo.getUserRadar(rivalId, version),
    ]);

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      profile.isPublic === 0 &&
      !profile.relationship.isFollowing &&
      viewerId !== rivalId
    ) {
      return res.status(403).json({ message: "This profile is private" });
    }

    return res.status(200).json({
      profile: {
        userId: profile.userId,
        userName: profile.userName,
        iidxId: profile.iidxId,
        profileImage: profile.profileImage,
        profileText: profile.profileText,
        follows: profile.follows,
        relationship: profile.relationship,
        current: profile.current,
      },
      compare: {
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
      },
    });
  } catch (error: any) {
    console.error("Comparison API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
