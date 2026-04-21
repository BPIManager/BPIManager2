import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { statsRepo } from "@/lib/db/stats";
import { rejectAccess } from "@/middlewares/api/withApi";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { OvertakenMap } from "@/types/logs/overtaken";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { batchScoresQuerySchema } from "@/schemas/batches/query";
import { IIDXVersion } from "@/types/iidx/version";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  const query = parseQuery(batchScoresQuerySchema, req.query, res);
  if (!query) return;
  const {
    userId: uid,
    batchId: dateStr,
    version: ver,
    type,
    groupedBy,
  } = query;

  try {
    const access = await checkProfileAccess(req, uid);
    if (!access.hasAccess) return rejectAccess(res, access);

    const basis: "lastPlayed" | "createdAt" =
      groupedBy === "lastPlayed" ? "lastPlayed" : "createdAt";

    const range = logsRepo.getJstRange(dateStr, type);
    const nav = await logsRepo.getRangeNavigation(uid, ver, range, basis);

    let responseData:
      | Awaited<ReturnType<typeof handleLastPlayedBase>>
      | Awaited<ReturnType<typeof handleCreatedAtBase>>;
    const isOwnLog = access.viewerId === uid;

    if (groupedBy === "lastPlayed") {
      responseData = await handleLastPlayedBase(uid, ver, range, nav, isOwnLog);
    } else {
      responseData = await handleCreatedAtBase(uid, ver, range, nav, isOwnLog);
    }

    return res.status(200).json({
      ...responseData,
      range: {
        start: range.start,
        end: range.end,
        unit: type,
      },
    });
  } catch (error: unknown) {
    console.error(`Fetch Detail Error:`, error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}

/**
 * プレイ日時ベースの詳細取得
 */
async function handleLastPlayedBase(
  uid: string,
  ver: IIDXVersion,
  range: ReturnType<typeof logsRepo.getJstRange>,
  nav: Awaited<ReturnType<typeof logsRepo.getRangeNavigation>>,
  isOwnLog: boolean,
) {
  const [history, totalSongs, dailyScores, overtaken] = await Promise.all([
    statsRepo.getScoreHistory(uid, ver, [], []),
    statsRepo.getTotalSongCount([12], []),
    logsRepo.getScoresByLastPlayedRange(uid, ver, range),
    isOwnLog
      ? logsRepo.getOvertakenRivals(uid, ver, {
          range: { ...range, basis: "lastPlayed" },
        })
      : [],
  ]);

  if (dailyScores.length === 0) {
    throw new Error("No activity found for this period.");
  }

  const overtakenMap = createOvertakenMap(overtaken);
  const overtakenSongIds = Object.keys(overtakenMap)
    .map(Number)
    .filter(Boolean);
  const rivalScores =
    isOwnLog && overtakenSongIds.length > 0
      ? await logsRepo.getRivalScoresForSongs({
          userId: uid,
          version: ver,
          songIds: overtakenSongIds,
        })
      : [];
  const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

  const timeline = calculateTotalBpi(history, totalSongs, ver, 0);
  const currentSnapshot = timeline.find((t) => t.id === range.label);

  const currentIndex = timeline.findIndex((t) => t.id === range.label);
  const prevSnapshot = timeline[currentIndex + 1];
  const nextSnapshot = timeline[currentIndex - 1];
  return {
    songs: dailyScores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: overtakenMap[s.songId] || [],
        rivalRankInfo: rivalRankMap[s.songId] ?? null,
      };
    }),
    pagination: {
      prev: {
        batchId: nav.prevDate || "previous",
        createdAt: prevSnapshot?.createdAt || null,
        totalBpi: prevSnapshot?.totalBpi || -15,
      },
      current: {
        batchId: range.label,
        createdAt: range.end,
        totalBpi: currentSnapshot?.totalBpi || -15,
        label: `${range.label} のプレイ履歴`,
      },
      next: {
        batchId: nav.nextDate || "next",
        createdAt: nextSnapshot?.createdAt || null,
        totalBpi: nextSnapshot?.totalBpi || -15,
      },
      groupedBy: "lastPlayed",
    },
  };
}

/**
 * インポート日時(バッチ)ベースの詳細取得
 */
async function handleCreatedAtBase(
  uid: string,
  ver: IIDXVersion,
  range: ReturnType<typeof logsRepo.getJstRange>,
  nav: Awaited<ReturnType<typeof logsRepo.getRangeNavigation>>,
  isOwnLog: boolean,
) {
  const batches = await logsRepo.findBatchesInRange(
    uid,
    ver,
    range.start,
    range.end,
  );
  if (batches.length === 0) throw new Error("No logs found.");

  const [scores, overtaken] = await Promise.all([
    logsRepo.getScoresWithDetails(uid, ver, {
      batchIds: batches.map((b) => b.batchId),
      comparisonTime: batches[0].createdAt,
    }),
    isOwnLog
      ? logsRepo.getOvertakenRivals(uid, ver, {
          range: { ...range, basis: "createdAt" },
        })
      : [],
  ]);
  const overtakenMap = createOvertakenMap(overtaken);
  const overtakenSongIds = Object.keys(overtakenMap)
    .map(Number)
    .filter(Boolean);
  const rivalScores =
    isOwnLog && overtakenSongIds.length > 0
      ? await logsRepo.getRivalScoresForSongs({
          userId: uid,
          version: ver,
          songIds: overtakenSongIds,
        })
      : [];
  const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

  return {
    songs: scores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: s.songId ? overtakenMap[s.songId] || [] : [],
        rivalRankInfo: s.songId ? (rivalRankMap[s.songId] ?? null) : null,
      };
    }),
    pagination: {
      prev: nav.prevDate,
      current: {
        ...batches[batches.length - 1],
        count: batches.length,
      },
      next: nav.nextDate,
      groupedBy: "createdAt",
    },
  };
}

export function computeRivalRankMap(
  overtakenMap: OvertakenMap,
  rivalScores: { songId: number | null; exScore: number | null }[],
): Record<
  number,
  { myRankBefore: number; myRankAfter: number; totalRivals: number }
> {
  const scoresBySong: Record<number, number[]> = {};
  for (const row of rivalScores) {
    if (row.songId == null || row.exScore == null) continue;
    if (!scoresBySong[row.songId]) scoresBySong[row.songId] = [];
    scoresBySong[row.songId].push(row.exScore);
  }

  const result: Record<
    number,
    { myRankBefore: number; myRankAfter: number; totalRivals: number }
  > = {};
  for (const [songIdStr, rivals] of Object.entries(overtakenMap)) {
    const songId = Number(songIdStr);
    const myOldScore = rivals[0]?.myOldScore ?? null;
    const myNewScore = rivals[0]?.myNewScore ?? 0;
    const allScores = scoresBySong[songId] ?? [];
    const totalRivals = allScores.length;
    result[songId] = {
      myRankBefore:
        myOldScore !== null
          ? allScores.filter((s) => s > myOldScore).length + 1
          : totalRivals + 1,
      myRankAfter: allScores.filter((s) => s > myNewScore).length + 1,
      totalRivals,
    };
  }
  return result;
}

export function createOvertakenMap(
  overtakenList: Awaited<ReturnType<typeof logsRepo.getOvertakenRivals>>,
): OvertakenMap {
  return overtakenList.reduce<OvertakenMap>((acc, curr) => {
    if (!curr.songId) return acc;
    if (!acc[curr.songId]) acc[curr.songId] = [];
    acc[curr.songId].push({
      rivalUserId: curr.rivalUserId,
      rivalName: curr.rivalName,
      rivalProfileImage: curr.rivalProfileImage,
      rivalScore: curr.rivalScore,
      myNewScore: curr.myNewScore,
      myOldScore: curr.myOldScore,
    });
    return acc;
  }, {});
}
