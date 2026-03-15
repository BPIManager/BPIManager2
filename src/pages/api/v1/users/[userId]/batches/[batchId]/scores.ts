import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { OvertakenMap } from "@/types/logs/overtaken";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";

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

  const {
    userId,
    batchId,
    version,
    type = "day",
    groupedBy = "createdAt",
  } = req.query;

  if (!userId || !batchId || !version) {
    return res.status(400).json({ message: "Required params missing." });
  }

  const uid = String(userId);
  const dateStr = String(batchId);
  const ver = String(version);

  try {
    const access = await checkProfileAccess(req, uid);
    if (!access.hasAccess) return rejectAccess(res, access);

    const basis: "lastPlayed" | "createdAt" =
      groupedBy === "lastPlayed" ? "lastPlayed" : "createdAt";

    const range = logsRepo.getJstRange(dateStr, type as any);
    const nav = await logsRepo.getRangeNavigation(uid, ver, range, basis);

    let responseData: any;
    const isOwnLog = access.viewerId === userId;

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
  } catch (error: any) {
    console.error(`Fetch Detail Error:`, error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}

/**
 * プレイ日時ベースの詳細取得
 */
async function handleLastPlayedBase(
  uid: string,
  ver: string,
  range: any,
  nav: any,
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
  ver: string,
  range: any,
  nav: any,
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

  return {
    songs: scores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: s.songId ? overtakenMap[s.songId] || [] : [],
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
