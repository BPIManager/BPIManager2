import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { db } from "@/lib/db";
import { monthlyReviewRepo } from "@/lib/db/monthly-review";
import { statsRepo } from "@/lib/db/stats";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/latestVersion";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, month, version } = req.query;
  if (!userId || !month || !version)
    return res.status(400).json({ message: "userId, month, version are required" });

  const isYearMode = /^\d{4}$/.test(month as string);
  const isMonthMode = /^\d{4}-\d{2}$/.test(month as string);
  const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version as string);

  if (!isValidVersion || (!isYearMode && !isMonthMode))
    return res.status(400).json({ message: "Invalid month or version" });

  const access = await checkUserAccess(req, userId as string);
  if (!access.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const monthStart = isYearMode
      ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
      : dayjs.tz(`${month as string}-01`).format("YYYY-MM-DD");
    const monthEnd = isYearMode
      ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
      : dayjs.tz(`${month as string}-01`).endOf("month").format("YYYY-MM-DD");

    const rivalRows = await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .select(["u.userId", "u.userName", "u.profileImage"])
      .where("f.followerId", "=", userId as string)
      .where("u.isPublic", "=", 1)
      .orderBy("u.userName", "asc")
      .execute();

    if (rivalRows.length === 0) return res.status(200).json({ rivals: [] });

    const rivalIds = rivalRows.map((r) => r.userId);

    const [preMonthState, inMonthHistory, totalSongs] = await Promise.all([
      monthlyReviewRepo.getPreMonthBpiStateForUsers(
        rivalIds,
        version as string,
        monthStart,
      ),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        rivalIds,
        version as string,
        monthStart,
        monthEnd,
      ),
      statsRepo.getTotalSongCount([12], [...IIDX_DIFFICULTIES]),
    ]);

    const preByUser = new Map<string, Map<number, number>>();
    for (const s of preMonthState) {
      if (!preByUser.has(s.userId)) preByUser.set(s.userId, new Map());
      preByUser.get(s.userId)!.set(s.songId, s.bpi != null ? Number(s.bpi) : -15);
    }

    const historyByUser = new Map<string, typeof inMonthHistory>();
    for (const s of inMonthHistory) {
      if (!historyByUser.has(s.userId)) historyByUser.set(s.userId, []);
      historyByUser.get(s.userId)!.push(s);
    }

    const rivals = rivalRows.map((r) => {
      const preMap = preByUser.get(r.userId) ?? new Map<number, number>();
      const history = historyByUser.get(r.userId) ?? [];
      const { bpiStart, bpiEnd } = buildBpiTimeline(
        preMap,
        history,
        totalSongs,
        isYearMode,
      );
      return {
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage,
        bpiStart,
        bpiEnd,
      };
    });

    return res.status(200).json({ rivals });
  } catch (error) {
    console.error("Rival monthly review summary Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
