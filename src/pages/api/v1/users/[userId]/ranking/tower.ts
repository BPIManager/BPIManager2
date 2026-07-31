import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { iidxTowerAggregateRepo } from "@/lib/db/aggregates/iidxTower";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { maskPrivateIdentity } from "@/lib/db/shared/privacyMask";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

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

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const viewerId = req.authUid;

  const rawVersion = String(req.query.version ?? "");
  const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
    ? rawVersion
    : latestVersion;

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
      iidxId: u.isPublic ? u.iidxId : null,
      totalCount: Number(u.totalCount),
      keyCount: Number(u.keyCount),
      scratchCount: Number(u.scratchCount),
      isSelf: u.userId === viewerId,
    }));

    const selfEntry = rankings.find((u) => u.isSelf);

    return res.status(200).json({
      rankings,
      totalCount: rankings.length,
      selfRank: selfEntry?.rank ?? 0,
      startDate,
      endDate,
      viewerRadar,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: msg });
  }
}

export default withAuth(handler);
