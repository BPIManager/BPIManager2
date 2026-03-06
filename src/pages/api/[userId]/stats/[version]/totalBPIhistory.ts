import { latestVersion } from "@/constants/latestVersion";
import { BpiCalculator } from "@/lib/bpi";
import { StatsRepository } from "@/lib/db/stats";
import { checkUserAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";

const repository = new StatsRepository();

const DIFFICULTY_LABELS: Record<string, string> = {
  HYPER: "[H]",
  ANOTHER: "[A]",
  LEGGENDARIA: "[L]",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version = latestVersion, level, difficulty } = req.query;

  const targetLevels = (
    Array.isArray(level) ? level : level ? [level] : []
  ).map((v) => parseInt(v, 10));
  const targetDiffs = Array.isArray(difficulty)
    ? difficulty
    : difficulty
      ? [difficulty]
      : [];

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    const [allLogs, totalSongs] = await Promise.all([
      repository.getScoreHistory(
        userId as string,
        version as string,
        targetLevels,
        targetDiffs,
      ),
      repository.getTotalSongCount(targetLevels, targetDiffs),
    ]);

    if (allLogs.length === 0) return res.status(200).json([]);

    const logsByDate: Record<string, typeof allLogs> = {};

    allLogs.forEach((log) => {
      if (!log.songId || !log.lastPlayed) return;
      const date = new Date(log.lastPlayed).toISOString().split("T")[0];
      if (!logsByDate[date]) logsByDate[date] = [];
      logsByDate[date].push(log);
    });

    const trend = [];
    const latestBpisBySong = new Map<number, number>();

    const firstLogDate = new Date(allLogs[0].lastPlayed);
    const startDate = new Date(
      firstLogDate.getFullYear(),
      firstLogDate.getMonth(),
      firstLogDate.getDate(),
    );

    const lastLogRaw = allLogs[allLogs.length - 1].lastPlayed;
    const lastLogDate = new Date(lastLogRaw);
    const endDate = new Date(
      lastLogDate.getFullYear(),
      lastLogDate.getMonth(),
      lastLogDate.getDate(),
    );

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];

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

    return res.status(200).json(trend);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
