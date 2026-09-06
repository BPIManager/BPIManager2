import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";
import { JAPAN_PREFECTURES } from "@/constants/iidx/rankingPrefectures";
import { iidxTowerAggregateRepo } from "@/lib/db/aggregates/iidxTower";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { userRankingRepo } from "@/lib/db/aggregates/userProfiles/ranking";
import { radarCacheRepo } from "@/lib/db/domains/radar";
import { maskPrivateIdentity } from "@/lib/db/shared/privacyMask";
import { canViewUserData } from "@/lib/db/shared/visibility";
import { calculateRadar } from "@/lib/radar/calculator";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * ranking ドメイン（`users/[userId]/ranking/**`）のビジネスロジックを
 * `res` 書き込みから切り離した subhandler 群。全エンドポイント `withAuth`
 * （本人のみ、`viewerId = req.authUid`）。ルートは v1/v2 でこれを共有する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

const RADAR_CATEGORIES = [
  "notes",
  "chord",
  "peak",
  "charge",
  "scratch",
  "soflan",
] as const;
type RadarCategory = (typeof RADAR_CATEGORIES)[number];

function targetOf(req: AuthenticatedNextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : req.authUid;
}

function parsePeriodDates(
  period: string,
  date: string,
): { startDate: string; endDate: string } {
  const d = dayjs(date);
  if (!d.isValid()) {
    const today = dayjs().format("YYYY-MM-DD");
    return { startDate: today, endDate: today };
  }

  if (period === "week") {
    const dow = d.day();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = d.add(mondayOffset, "day");
    return {
      startDate: monday.format("YYYY-MM-DD"),
      endDate: monday.add(6, "day").format("YYYY-MM-DD"),
    };
  }

  if (period === "month") {
    return {
      startDate: d.startOf("month").format("YYYY-MM-DD"),
      endDate: d.endOf("month").format("YYYY-MM-DD"),
    };
  }

  const dateStr = d.format("YYYY-MM-DD");
  return { startDate: dateStr, endDate: dateStr };
}

/** GET /users/[userId]/ranking/global */
export async function handleGlobalRanking(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  const version = resolveVersion(req.query.version);

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
    const [users, viewerRadarCache] = await Promise.all([
      userRankingRepo.getGlobalRanking(
        version,
        category,
        effectiveFilterArea,
        effectiveFilterArenaClass,
      ),
      radarCacheRepo.getForUserAndVersion(viewerId, latestVersion),
    ]);

    const viewerRadar = {
      NOTES: { totalBpi: Number(viewerRadarCache?.notes ?? -15), songs: [] },
      CHORD: { totalBpi: Number(viewerRadarCache?.chord ?? -15), songs: [] },
      PEAK: { totalBpi: Number(viewerRadarCache?.peak ?? -15), songs: [] },
      CHARGE: { totalBpi: Number(viewerRadarCache?.charge ?? -15), songs: [] },
      SCRATCH: {
        totalBpi: Number(viewerRadarCache?.scratch ?? -15),
        songs: [],
      },
      SOFLAN: { totalBpi: Number(viewerRadarCache?.soflan ?? -15), songs: [] },
    };

    const rankings = users.map((u, i) => {
      const radarRow = u as typeof u &
        Partial<Record<RadarCategory, string | null>>;
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
      // 匿名の全体ランキングのため、閲覧者に関わらずisPublicのみで判定する(自分自身でも
      // 非公開ならマスクされる。viewerIdを渡さないことでcanViewUserDataの自分自身
      // バイパスを無効化している)
      const isIdentityVisible =
        canViewUserData({ targetUserId: u.userId, isPublic: u.isPublic }) &&
        isAreaPublic &&
        isArenaClassPublic;

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

    return {
      result: ok({
        rankings,
        totalCount: rankings.length,
        selfRank: selfEntry?.rank ?? 0,
        viewerRadar,
      }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/ranking/song/[songId] */
export async function handleRankingSongById(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  const songIdNum = parseInt(req.query.songId as string);
  if (isNaN(songIdNum)) {
    return { result: err(400, "Invalid songId"), targetUserId, viewerId };
  }

  try {
    const result = await statsTablesRepo.getSongRanking(
      songIdNum,
      resolveVersion(req.query.version),
      viewerId,
    );
    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/ranking/songs */
export async function handleUserSongRankings(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<{ songs: unknown }>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  try {
    const songs = await statsTablesRepo.getUserSongRankings(
      viewerId,
      resolveVersion(req.query.version),
    );
    return { result: ok({ songs }), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/ranking/tower */
export async function handleTowerRanking(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  const version = resolveVersion(req.query.version);

  const period = String(req.query.period ?? "day");
  const today = dayjs().format("YYYY-MM-DD");
  const rawDate = String(req.query.date ?? today);
  const date = rawDate > today ? today : rawDate;

  const { startDate, endDate } = parsePeriodDates(period, date);

  try {
    const [rows, viewerScores] = await Promise.all([
      iidxTowerAggregateRepo.getTowerRanking({ version, startDate, endDate }),
      statsTablesRepo.getLatestScoresWithMusicData(viewerId, latestVersion),
    ]);

    const viewerRadar = calculateRadar(viewerScores);

    const rankings = rows.map((u, i) => ({
      rank: i + 1,
      ...maskPrivateIdentity({
        isPublic: u.isPublic,
        userId: u.userId,
        userName: u.userName,
        profileImage: u.profileImage,
        anonId: uuidv4(),
      }),
      isPublic: u.isPublic,
      iidxId: canViewUserData({ targetUserId: u.userId, isPublic: u.isPublic })
        ? u.iidxId
        : null,
      totalCount: Number(u.totalCount),
      keyCount: Number(u.keyCount),
      scratchCount: Number(u.scratchCount),
      isSelf: u.userId === viewerId,
    }));

    const selfEntry = rankings.find((u) => u.isSelf);

    return {
      result: ok({
        rankings,
        totalCount: rankings.length,
        selfRank: selfEntry?.rank ?? 0,
        startDate,
        endDate,
        viewerRadar,
      }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
