import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";

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
    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const range = logsRepo.getJstRange(dateStr, type as any);
    const nav = await logsRepo.getRangeNavigation(
      uid,
      ver,
      range,
      groupedBy as any,
    );

    let responseData: any;

    if (groupedBy === "lastPlayed") {
      responseData = await handleLastPlayedBase(uid, ver, range, nav);
    } else {
      responseData = await handleCreatedAtBase(uid, ver, range, nav);
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
) {
  const [history, totalSongs, dailyScores] = await Promise.all([
    statsRepo.getScoreHistory(uid, ver, [], []),
    statsRepo.getTotalSongCount([12], []),
    logsRepo.getScoresByLastPlayedRange(uid, ver, range),
  ]);

  if (dailyScores.length === 0) {
    throw new Error("No activity found for this period.");
  }

  const timeline = calculateTotalBpi(history, totalSongs, ver, 0);
  const currentSnapshot = timeline.find((t) => t.id === range.label);

  const currentIndex = timeline.findIndex((t) => t.id === range.label);
  const prevSnapshot = timeline[currentIndex + 1];
  console.log(prevSnapshot);
  return {
    songs: dailyScores.map(mapToLogNested),
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
      prevDate: nav.prevDate?.createdAt || null,
      nextDate: nav.nextDate?.createdAt || null,
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
) {
  const batches = await logsRepo.findBatchesInRange(
    uid,
    ver,
    range.start,
    range.end,
  );
  if (batches.length === 0) throw new Error("No logs found.");

  const [scores, batchNav] = await Promise.all([
    logsRepo.getScoresWithDetails(uid, ver, {
      batchIds: batches.map((b) => b.batchId),
      comparisonTime: batches[0].createdAt,
    }),
    logsRepo.getBatchNavigation(uid, ver, batches[0].createdAt),
  ]);

  return {
    songs: scores.map(mapToLogNested),
    pagination: {
      prev: batchNav.prev,
      current: {
        ...batches[batches.length - 1],
        count: batches.length,
      },
      prevDate: nav.prevDate,
      nextDate: nav.nextDate,
      groupedBy: "createdAt",
    },
  };
}
