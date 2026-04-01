import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { usersRepo } from "@/lib/db/users";
import { statsRepo } from "@/lib/db/stats";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { v4 as uuidv4 } from "uuid";

const RADAR_CATEGORIES = [
  "notes",
  "chord",
  "peak",
  "charge",
  "scratch",
  "soflan",
] as const;
type RadarCategory = (typeof RADAR_CATEGORIES)[number];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;
  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;
  if (!viewerId) return rejectAccess(res, access);

  const rawVersion = String(req.query.version ?? "");
  const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
    ? rawVersion
    : latestVersion;

  const rawCategory = String(req.query.category ?? "");
  const isRadarCategory = (RADAR_CATEGORIES as readonly string[]).includes(
    rawCategory,
  );
  // レーダーカテゴリは最新バージョンのみ（userRadarCache は最新バージョンのみ保持）
  const category =
    isRadarCategory && version === latestVersion ? rawCategory : "totalBpi";
  const effectiveRadarCategory = category !== "totalBpi";

  try {
    const [users, viewerScores] = await Promise.all([
      usersRepo.getGlobalRanking(version, category),
      statsRepo.getLatestScoresWithMusicData(viewerId, latestVersion),
    ]);

    const viewerRadar = calculateRadar(viewerScores);

    const rankings = users.map((u, i) => {
      const radarRow = u as typeof u & Partial<Record<RadarCategory, string | null>>;
      const rankValue = effectiveRadarCategory
        ? Number(radarRow[category as RadarCategory] ?? -15)
        : Number(u.totalBpi ?? -15);

      return {
        rank: i + 1,
        userId: u.isPublic ? u.userId : uuidv4(),
        userName: u.isPublic ? u.userName : "-",
        profileImage: u.isPublic ? u.profileImage : "",
        isPublic: u.isPublic,
        iidxId: u.isPublic ? u.iidxId : "",
        totalBpi: rankValue,
        arenaRank: u.isPublic ? (u.arenaRank ?? null) : "",
        isSelf: u.userId === viewerId,
      };
    });

    const selfEntry = rankings.find((u) => u.isSelf);

    return res.status(200).json({
      rankings,
      totalCount: rankings.length,
      selfRank: selfEntry?.rank ?? 0,
      viewerRadar,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
