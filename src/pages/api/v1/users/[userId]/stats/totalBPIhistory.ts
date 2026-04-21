import { BpiCalculator } from "@/lib/bpi";
import { statsRepo } from "@/lib/db/stats";
import dayjs from "@/lib/dayjs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import type { NextApiRequest, NextApiResponse } from "next";

const DIFFICULTY_LABELS: Record<string, string> = {
  HYPER: "[H]",
  ANOTHER: "[A]",
  LEGGENDARIA: "[L]",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseStatsQuery(req.query, res);
  if (!body) return;
  const { userId, version, levels, difficulties } = body;
  const groupBy = (req.query.groupBy as StatsGroupBy) || "day";

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const [allLogs, totalSongs] = await Promise.all([
      statsRepo.getScoreHistory(userId, version, levels, difficulties),
      statsRepo.getTotalSongCount(levels, difficulties),
    ]);

    if (allLogs.length === 0) return res.status(200).json([]);

    const toJSTDateStr = (date: Date | string): string =>
      dayjs(date).tz().format("YYYY-MM-DD");

    const logsByDate: Record<string, typeof allLogs> = {};
    allLogs.forEach((log) => {
      if (!log.songId || !log.lastPlayed) return;
      const date = toJSTDateStr(log.lastPlayed);
      if (!logsByDate[date]) logsByDate[date] = [];
      logsByDate[date].push(log);
    });

    const trend = [];
    const latestBpisBySong = new Map<number, number>();

    const startDate = dayjs(allLogs[0].lastPlayed).tz().startOf("day");
    const endDate = dayjs(allLogs[allLogs.length - 1].lastPlayed)
      .tz()
      .startOf("day");

    for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
      const dateStr = d.format("YYYY-MM-DD");
      const updatedOnThisDay = logsByDate[dateStr] || [];

      updatedOnThisDay.forEach((log) => {
        if (log.songId == null) return;
        latestBpisBySong.set(log.songId, log.bpi ?? -15);
      });

      const allCurrentBpis = Array.from(latestBpisBySong.values());
      const totalBpi = BpiCalculator.calculateTotalBPI(
        allCurrentBpis,
        totalSongs,
      );

      trend.push({
        date: dateStr,
        totalBpi,
        count: allCurrentBpis.length,
        updatedSongs: updatedOnThisDay
          .map((s) => {
            const suffix = DIFFICULTY_LABELS[s.difficulty as string] || "";
            return `${s.title}${suffix}`;
          })
          .filter(Boolean),
      });
    }

    if (groupBy === "day") return res.status(200).json(trend);

    const grouped = new Map<string, (typeof trend)[number]>();
    for (const item of trend) {
      const d = dayjs(item.date);
      let key: string;
      if (groupBy === "month") {
        key = d.format("YYYY-MM");
      } else {
        const dow = d.day();
        const offset = dow === 0 ? -6 : 1 - dow;
        key = d.add(offset, "day").format("YYYY-MM-DD");
      }
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { date: key, totalBpi: item.totalBpi, count: item.count, updatedSongs: [...item.updatedSongs] });
      } else {
        existing.totalBpi = item.totalBpi;
        existing.count = item.count;
        existing.updatedSongs.push(...item.updatedSongs);
      }
    }

    return res.status(200).json(Array.from(grouped.values()));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
