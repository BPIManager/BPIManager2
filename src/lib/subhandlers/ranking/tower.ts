import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { iidxTowerAggregateRepo } from "@/lib/db/aggregates/iidxTower";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { maskPrivateIdentity } from "@/lib/db/shared/privacyMask";
import { canViewUserData } from "@/lib/db/shared/visibility";
import { calculateRadar } from "@/lib/radar/calculator";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { parsePeriodDates, targetOf, type HandleOutcome } from "./_shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";

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
