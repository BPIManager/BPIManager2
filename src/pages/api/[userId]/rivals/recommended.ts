import { NextApiRequest, NextApiResponse } from "next";
import { UsersRepository } from "@/lib/db/users";
import { StatsRepository } from "@/lib/db/stats";
import { BpiCalculator } from "@/lib/bpi";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { latestVersion } from "@/constants/latestVersion";
import { calculateRadar } from "@/lib/radar/calculator";
import { BpiRepository } from "@/lib/db/bpi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;

  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;
  if (!viewerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const statsRepo = new StatsRepository();
    const usersRepo = new UsersRepository();
    const bpiRepo = new BpiRepository();
    const version = latestVersion;

    const viewerScores = await statsRepo.getLatestScoresWithMusicData(
      viewerId,
      version,
    );
    const latestTotalBpiRecord = await bpiRepo.getLatestTotalBpi(
      viewerId,
      version || latestVersion,
    );
    const latestTotalBpi = latestTotalBpiRecord
      ? latestTotalBpiRecord.totalBpi
      : -15;

    const viewerRadar = calculateRadar(viewerScores);

    const recommendedUsers = await usersRepo.getRecommendedUsers({
      viewerId,
      viewerTotalBpi: latestTotalBpi,
      version,
      limit: 20,
      range: 5.0,
    });

    return res.status(200).json({
      viewer: {
        userId: viewerId,
        totalBpi: latestTotalBpi,
        radar: viewerRadar,
      },
      users: recommendedUsers.map((user) => ({
        userId: user.userId,
        userName: user.userName,
        profileImage: user.profileImage,
        profileText: user.profileText,
        arenaRank: user.arenaRank ?? "N/A",
        totalBpi: Number(user.totalBpi),
        radar: {
          NOTES: Number(user.notes),
          CHORD: Number(user.chord),
          PEAK: Number(user.peak),
          CHARGE: Number(user.charge),
          SCRATCH: Number(user.scratch),
          SOFLAN: Number(user.soflan),
        },
      })),
    });
  } catch (error: any) {
    console.error("User list API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
