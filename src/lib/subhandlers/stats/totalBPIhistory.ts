import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { songsRepo } from "@/lib/db/domains/songs";
import { ok } from "@/middlewares/api/apiResult";
import { groupByOf, DIFFICULTY_LABELS } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";
import type { IBpiScoreObservation } from "@/types/songs/bpi";

export async function handleStatsTotalBpiHistory(
  q: StatsQuery,
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const groupBy = groupByOf(req);
  const [fullLogs, fullMaster] = await Promise.all([
    statsTablesRepo.getScoreHistory(q.userId, q.version, [], []),
    songsRepo.getSongMasterWithDef(),
  ]);
  const scopedMaster = fullMaster.filter(
    (s) =>
      (q.levels.length === 0 ||
        (s.difficultyLevel != null && q.levels.includes(s.difficultyLevel))) &&
      (q.difficulties.length === 0 ||
        (s.difficulty != null && q.difficulties.includes(s.difficulty))),
  );
  const scopedSongIds = new Set(scopedMaster.map((s) => s.songId));
  const scopedLogs = fullLogs.filter(
    (log) => log.songId != null && scopedSongIds.has(log.songId),
  );
  if (scopedLogs.length === 0) return ok([]);

  const toJSTDateStr = (date: Date | string): string =>
    dayjs(date).tz().format("YYYY-MM-DD");

  const scopedLogsByDate: Record<string, typeof scopedLogs> = {};
  scopedLogs.forEach((log) => {
    if (!log.songId || !log.lastPlayed) return;
    const date = toJSTDateStr(log.lastPlayed);
    if (!scopedLogsByDate[date]) scopedLogsByDate[date] = [];
    scopedLogsByDate[date].push(log);
  });

  const songNotesById = new Map(fullMaster.map((s) => [s.songId, s.notes]));
  const trend = [];
  // 表示用(prevExScore/prevBpiの差分レポート)はscopedLogsのみを対象に、日単位
  // で従来通り追跡する。observations(潜在スキル推定)側とは別管理にする
  const reportBpisBySong = new Map<number, number>();
  const reportExScoresBySong = new Map<number, number>();
  const startDate = dayjs(scopedLogs[0].lastPlayed).tz().startOf("day");
  const endDate = dayjs(scopedLogs[scopedLogs.length - 1].lastPlayed)
    .tz()
    .startOf("day");

  // observations(潜在スキル推定用、level11等スコープ外も含む全体)はstartDate
  // より前に反映済みの状態から始める
  const latestExScoresBySong = new Map<number, number>();
  fullLogs.forEach((log) => {
    if (!log.songId || !log.lastPlayed) return;
    if (dayjs(log.lastPlayed).tz().startOf("day").isBefore(startDate)) {
      latestExScoresBySong.set(log.songId, log.exScore);
    }
  });

  const logsInRange = fullLogs.filter((log) => {
    if (!log.songId || !log.lastPlayed) return false;
    const day = dayjs(log.lastPlayed).tz().startOf("day");
    return !day.isBefore(startDate) && !day.isAfter(endDate);
  });
  const stepGroups = new Map<string, typeof fullLogs>();
  logsInRange.forEach((log, index) => {
    const stepKey = log.batchId ? `batch:${log.batchId}` : `row:${index}`;
    if (!stepGroups.has(stepKey)) stepGroups.set(stepKey, []);
    stepGroups.get(stepKey)!.push(log);
  });
  // logsInRangeはlastPlayed昇順であり、Mapはキーの初出順を保持するため、
  // ここでの反復順がそのままステップの時系列順になる
  const sortedStepKeys = Array.from(stepGroups.keys());

  let bestTotalBpiSoFar: number | null = null;
  const dayTotalBpi = new Map<string, number>();
  for (const stepKey of sortedStepKeys) {
    const stepLogs = stepGroups.get(stepKey)!;
    stepLogs.forEach((log) => {
      if (log.songId != null) latestExScoresBySong.set(log.songId, log.exScore);
    });
    const observations: IBpiScoreObservation[] = Array.from(
      latestExScoresBySong.entries(),
    ).map(([songId, exScore]) => ({
      songId,
      notes: songNotesById.get(songId) ?? 0,
      exScore,
    }));
    const freshTotalBpi = BpiCalculator.calculateTotalBPI(
      observations,
      scopedMaster,
    );
    bestTotalBpiSoFar = BpiCalculator.ratchetTotalBpi(
      bestTotalBpiSoFar,
      freshTotalBpi,
    );
    const dateStr = toJSTDateStr(stepLogs[0].lastPlayed as Date | string);
    dayTotalBpi.set(dateStr, bestTotalBpiSoFar);
  }

  let lastKnownTotalBpi: number | null = null;
  for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
    const dateStr = d.format("YYYY-MM-DD");
    const updatedOnThisDay = scopedLogsByDate[dateStr] || [];
    const updatedSongs = updatedOnThisDay
      .filter((s) => s.songId != null)
      .map((s) => {
        const songId = s.songId as number;
        const suffix = DIFFICULTY_LABELS[s.difficulty as string] || "";
        const prevExScore = reportExScoresBySong.get(songId) ?? null;
        const prevBpi = reportBpisBySong.get(songId) ?? null;
        const newBpi = s.bpi ?? -15;
        reportBpisBySong.set(songId, newBpi);
        reportExScoresBySong.set(songId, s.exScore);
        return {
          title: `${s.title}${suffix}`,
          prevExScore,
          newExScore: s.exScore,
          prevBpi,
          newBpi,
        };
      });
    if (dayTotalBpi.has(dateStr)) lastKnownTotalBpi = dayTotalBpi.get(dateStr)!;
    trend.push({
      date: dateStr,
      totalBpi: lastKnownTotalBpi as number,
      count: reportBpisBySong.size,
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
