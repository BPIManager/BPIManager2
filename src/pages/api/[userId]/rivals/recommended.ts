import { NextApiRequest, NextApiResponse } from "next";
import { UsersRepository } from "@/lib/db/users";
import { StatsRepository } from "@/lib/db/stats";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { latestVersion } from "@/constants/latestVersion";
import { calculateRadar } from "@/lib/radar/calculator";
import { BpiRepository } from "@/lib/db/bpi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();
  const { userId, q, p, s, o } = req.query;
  const currentPage = Math.max(1, Number(p || 1));
  const limit = 20;
  const offset = (currentPage - 1) * limit;
  const sortKey = (s as string) || "totalBpi";
  const orderMode = (o as "distance" | "desc" | "newest") || "distance";

  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;
  if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const statsRepo = new StatsRepository();
    const usersRepo = new UsersRepository();
    const bpiRepo = new BpiRepository();
    const version = latestVersion;

    const viewerScores = await statsRepo.getLatestScoresWithMusicData(
      viewerId,
      version,
    );
    const viewerRadar = calculateRadar(viewerScores);

    let viewerBaseValue: number;

    if (sortKey === "totalBpi") {
      const record = await bpiRepo.getLatestTotalBpi(viewerId, version);
      viewerBaseValue = record ? record.totalBpi : -15;
      console.log(record);
    } else {
      const category = sortKey.toUpperCase() as keyof typeof viewerRadar;
      viewerBaseValue = viewerRadar[category]?.totalBpi ?? -15;
    }
    const recommendedUsers = await usersRepo.getRecommendedUsers({
      viewerId,
      viewerValue: viewerBaseValue,
      version,
      limit,
      offset,
      searchQuery: q as string,
      sort: sortKey,
      order: orderMode,
    });

    return res.status(200).json({
      viewer: {
        userId: viewerId,
        totalBpi: viewerBaseValue,
        radar: viewerRadar,
      },
      users: recommendedUsers.map((user) => ({
        userId: user.userId,
        iidxId: user.iidxId,
        userName: user.userName,
        profileImage: user.profileImage,
        profileText: user.profileText,
        arenaRank: user.arenaRank ?? "N/A",
        totalBpi: Number(user.totalBpi),
        updatedAt: user.createdAt, //バッチidの作成時間が最終更新日時
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
