import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { usersRepo } from "@/lib/db/users";
import { statsRepo } from "@/lib/db/stats";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { v4 as uuidv4 } from "uuid";
import { JAPAN_PREFECTURES } from "@/constants/iidx/rankingPrefectures";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";

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

  const rawArea = String(req.query.area ?? "");
  const filterArea = (JAPAN_PREFECTURES as readonly string[]).includes(rawArea)
    ? rawArea
    : undefined;

  const rawArenaClass = String(req.query.arenaClass ?? "");
  const filterArenaClass = (ARENA_RANK_ORDER as readonly string[]).includes(
    rawArenaClass,
  )
    ? rawArenaClass
    : undefined;

  // フィルタは totalBpi カテゴリのみ有効
  const effectiveFilterArea = category === "totalBpi" ? filterArea : undefined;
  const effectiveFilterArenaClass =
    category === "totalBpi" ? filterArenaClass : undefined;

  try {
    const [users, viewerScores] = await Promise.all([
      usersRepo.getGlobalRanking(
        version,
        category,
        effectiveFilterArea,
        effectiveFilterArenaClass,
      ),
      statsRepo.getLatestScoresWithMusicData(viewerId, latestVersion),
    ]);

    const viewerRadar = calculateRadar(viewerScores);

    const rankings = users.map((u, i) => {
      const radarRow = u as typeof u & Partial<Record<RadarCategory, string | null>>;
      const rankValue = effectiveRadarCategory
        ? Number(radarRow[category as RadarCategory] ?? -15)
        : Number(u.totalBpi ?? -15);

      const filteredRow = u as typeof u & {
        showArea?: number;
        showArenaClass?: number;
      };
      const isAreaPublic = !effectiveFilterArea || filteredRow.showArea === 1;
      const isArenaClassPublic =
        !effectiveFilterArenaClass || filteredRow.showArenaClass !== 0;
      const isIdentityVisible = u.isPublic && isAreaPublic && isArenaClassPublic;

      return {
        rank: i + 1,
        userId: isIdentityVisible ? u.userId : uuidv4(),
        userName: isIdentityVisible ? u.userName : "非公開ユーザー",
        profileImage: isIdentityVisible ? u.profileImage : null,
        isPublic: u.isPublic,
        iidxId: isIdentityVisible ? u.iidxId : null,
        totalBpi: rankValue,
        arenaClass: isIdentityVisible ? (u.arenaClass ?? null) : null,
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
