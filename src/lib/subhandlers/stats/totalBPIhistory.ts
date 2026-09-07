import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { ok } from "@/middlewares/api/apiResult";
import { groupByOf, DIFFICULTY_LABELS } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

export async function handleStatsTotalBpiHistory(
  q: StatsQuery,
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const groupBy = groupByOf(req);
  const [allLogs, totalSongs] = await Promise.all([
    statsTablesRepo.getScoreHistory(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    ),
    statsTablesRepo.getTotalSongCount(q.levels, q.difficulties),
  ]);
  if (allLogs.length === 0) return ok([]);

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
  const latestExScoresBySong = new Map<number, number>();
  const startDate = dayjs(allLogs[0].lastPlayed).tz().startOf("day");
  const endDate = dayjs(allLogs[allLogs.length - 1].lastPlayed)
    .tz()
    .startOf("day");

  for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
    const dateStr = d.format("YYYY-MM-DD");
    const updatedOnThisDay = logsByDate[dateStr] || [];
    const updatedSongs = updatedOnThisDay
      .filter((s) => s.songId != null)
      .map((s) => {
        const songId = s.songId as number;
        const suffix = DIFFICULTY_LABELS[s.difficulty as string] || "";
        const prevExScore = latestExScoresBySong.get(songId) ?? null;
        const prevBpi = latestBpisBySong.get(songId) ?? null;
        const newBpi = s.bpi ?? -15;
        latestBpisBySong.set(songId, newBpi);
        latestExScoresBySong.set(songId, s.exScore);
        return {
          title: `${s.title}${suffix}`,
          prevExScore,
          newExScore: s.exScore,
          prevBpi,
          newBpi,
        };
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
      updatedSongs,
    });
  }

  if (groupBy === "day") return ok(trend);

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
      grouped.set(key, {
        date: key,
        totalBpi: item.totalBpi,
        count: item.count,
        updatedSongs: [...item.updatedSongs],
      });
    } else {
      existing.totalBpi = item.totalBpi;
      existing.count = item.count;
      existing.updatedSongs.push(...item.updatedSongs);
    }
  }
  return ok(Array.from(grouped.values()));
}
