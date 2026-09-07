import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { groupByOf, percentile, DIFFICULTY_LABELS } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
import type { IIDXVersion } from "@/types/iidx/version";
import type { HandlerResult } from "@/types/api";

export async function handleStatsActiveDates(
  q: { userId: string; version: IIDXVersion },
): Promise<HandlerResult<unknown>> {
  const activity = await statsChartsRepo.getActivityData(
    q.userId,
    q.version,
    [12],
  );
  return ok(activity.filter((d) => Number(d.count) > 0).map((d) => d.date));
}

/** GET stats/activity */
export async function handleStatsActivity(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const activity = await statsChartsRepo.getActivityData(
    q.userId,
    q.version,
    q.levels,
    q.difficulties,
  );
  return ok(activity);
}


export async function handleStatsBpiBoxStats(
  q: StatsQuery,
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  try {
    const groupBy = groupByOf(req);
    const { scores, tower } = await statsChartsRepo.getBpiAndVolumePerDate(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    );

    const groupedTower = new Map<string, number>();
    for (const t of tower) {
      const d = dayjs(t.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");
      const count = Number(t.keyCount) + Number(t.scratchCount);
      groupedTower.set(dateKey, (groupedTower.get(dateKey) || 0) + count);
    }

    const grouped = new Map<
      string,
      { bpiMap: Map<number, number>; notesMap: Map<number, number> }
    >();
    for (const row of scores) {
      const d = dayjs(row.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");
      const current = grouped.get(dateKey) ?? {
        bpiMap: new Map(),
        notesMap: new Map(),
      };
      const songId = Number(row.songId);
      const bpi = Number(row.bpi);
      const notes = Number(row.notes);
      if (!current.bpiMap.has(songId) || current.bpiMap.get(songId)! < bpi) {
        current.bpiMap.set(songId, bpi);
        current.notesMap.set(songId, notes);
      }
      grouped.set(dateKey, current);
    }

    const result = [];
    for (const [date, data] of grouped.entries()) {
      const bpis = Array.from(data.bpiMap.values());
      const sorted = bpis.sort((a, b) => a - b);
      const count = sorted.length;
      const registeredNotes = Array.from(data.notesMap.values()).reduce(
        (a, b) => a + b,
        0,
      );
      const totalPhysicalNotes = groupedTower.get(date) || 0;
      const efficiency =
        totalPhysicalNotes > 0 ? registeredNotes / totalPhysicalNotes : 0;
      const top75 = sorted.slice(Math.floor(count * 0.25));
      const top25 = sorted.slice(Math.floor(count * 0.75));
      result.push({
        date,
        min: sorted[0],
        max: sorted[count - 1],
        median: percentile(sorted, 50),
        p25: percentile(sorted, 25),
        p75: percentile(sorted, 75),
        count,
        totalBpi: BpiCalculator.calculateTotalBPI(sorted, count),
        totalBpiTop75: BpiCalculator.calculateTotalBPI(top75, top75.length),
        totalBpiTop25: BpiCalculator.calculateTotalBPI(top25, top25.length),
        totalPhysicalNotes,
        registeredNotes,
        efficiency: Math.min(efficiency * 100, 100),
      });
    }
    result.sort((a, b) => a.date.localeCompare(b.date));
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}

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
    const totalBpi = BpiCalculator.calculateTotalBPI(allCurrentBpis, totalSongs);
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
