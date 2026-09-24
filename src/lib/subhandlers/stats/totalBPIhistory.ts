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

// 曲単位の厳密な内訳(rawTotalBpiAfter等)を計算する対象を直近この件数に絞り、履歴が長いユーザーでの計算量爆発を防ぐ
const DETAIL_WINDOW_SIZE = 300;

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
  // 表示用の差分レポートはscopedLogsのみ対象。observations(潜在スキル推定)側とは別管理
  const reportBpisBySong = new Map<number, number>();
  const reportExScoresBySong = new Map<number, number>();
  const startDate = dayjs(scopedLogs[0].lastPlayed).tz().startOf("day");
  const endDate = dayjs(scopedLogs[scopedLogs.length - 1].lastPlayed)
    .tz()
    .startOf("day");

  // observations(スコープ外含む全体)はstartDateより前に反映済みの状態から始める
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

  // Pass 1: バッチ単位で全期間を安く計算する(日単位だと同日内の境界が拾えずPass2の起点がズレる)
  const stepGroups = new Map<string, typeof logsInRange>();
  logsInRange.forEach((log, index) => {
    const stepKey = log.batchId ? `batch:${log.batchId}` : `row:${index}`;
    if (!stepGroups.has(stepKey)) stepGroups.set(stepKey, []);
    stepGroups.get(stepKey)!.push(log);
  });
  // logsInRangeはlastPlayed昇順・Mapは初出順保持なので、この反復順がそのまま時系列順になる
  const sortedStepKeys = Array.from(stepGroups.keys());

  let bestTotalBpiSoFar: number | null = null;
  const dayTotalBpi = new Map<string, number>();
  const dayRawTotalBpi = new Map<string, number>();
  const dayLatentSkill = new Map<string, number | null>();
  // ステップごとの結果を保持し、Pass2の起点を正確にシークするのに使う
  const stepResults: {
    rawAfter: number;
    bestAfter: number;
    latentSkillAfter: number | null;
    scopedCount: number;
  }[] = [];
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
    const latentSkill = BpiCalculator.estimateLatentSkill(
      observations,
      scopedMaster,
    );
    bestTotalBpiSoFar = BpiCalculator.ratchetTotalBpi(
      bestTotalBpiSoFar,
      freshTotalBpi,
    );
    const dateStr = toJSTDateStr(stepLogs[0].lastPlayed as Date | string);
    dayTotalBpi.set(dateStr, bestTotalBpiSoFar);
    dayRawTotalBpi.set(dateStr, freshTotalBpi);
    dayLatentSkill.set(dateStr, latentSkill);
    const scopedCount = stepLogs.filter(
      (log) => log.songId != null && scopedSongIds.has(log.songId),
    ).length;
    stepResults.push({
      rawAfter: freshTotalBpi,
      bestAfter: bestTotalBpiSoFar,
      latentSkillAfter: latentSkill,
      scopedCount,
    });
  }

  // Pass 2: 曲単位の内訳。末尾からスコープ内プレイ数を積み上げ、ステップ境界でウィンドウを区切る
  let accumulatedScopedCount = 0;
  let windowStartStepIdx = stepResults.length;
  for (let i = stepResults.length - 1; i >= 0; i--) {
    accumulatedScopedCount += stepResults[i].scopedCount;
    windowStartStepIdx = i;
    if (accumulatedScopedCount >= DETAIL_WINDOW_SIZE) break;
  }
  // 起点が先頭ステップ=実質的な初回プレイなので、そこだけ比較対象がなく差分を出さない
  const windowCoversFullHistory = windowStartStepIdx === 0;

  const rowResultByLogId = new Map<
    number,
    {
      rawAfter: number;
      rawDelta: number | null;
      bestAfter: number;
      bestDelta: number | null;
      latentSkillAfter: number | null;
      latentSkillDelta: number | null;
    }
  >();

  if (windowStartStepIdx < stepResults.length) {
    const windowStartLog = stepGroups.get(sortedStepKeys[windowStartStepIdx])![0];
    const windowStart = dayjs(windowStartLog.lastPlayed as Date | string).tz();

    const seededExScoresBySong = new Map<number, number>();
    fullLogs.forEach((log) => {
      if (!log.songId || !log.lastPlayed) return;
      if (dayjs(log.lastPlayed).tz().isBefore(windowStart)) {
        seededExScoresBySong.set(log.songId, log.exScore);
      }
    });

    const seedStep = stepResults[windowStartStepIdx - 1];
    let prevRawTotalBpi =
      seedStep?.rawAfter ??
      BpiCalculator.calculateTotalBPI(
        Array.from(seededExScoresBySong.entries()).map(
          ([songId, exScore]) => ({
            songId,
            notes: songNotesById.get(songId) ?? 0,
            exScore,
          }),
        ),
        scopedMaster,
      );
    let prevBestTotalBpi: number | null = seedStep?.bestAfter ?? null;
    let prevLatentSkill: number | null = seedStep?.latentSkillAfter ?? null;

    const windowLogsInOrder = sortedStepKeys
      .slice(windowStartStepIdx)
      .flatMap((key) => stepGroups.get(key)!);
    let isFirstScopedRowInWindow = true;
    for (const log of windowLogsInOrder) {
      if (log.songId != null) seededExScoresBySong.set(log.songId, log.exScore);
      const observations: IBpiScoreObservation[] = Array.from(
        seededExScoresBySong.entries(),
      ).map(([songId, exScore]) => ({
        songId,
        notes: songNotesById.get(songId) ?? 0,
        exScore,
      }));
      const freshTotalBpi = BpiCalculator.calculateTotalBPI(
        observations,
        scopedMaster,
      );
      const latentSkill = BpiCalculator.estimateLatentSkill(
        observations,
        scopedMaster,
      );
      const newBestTotalBpi = BpiCalculator.ratchetTotalBpi(
        prevBestTotalBpi,
        freshTotalBpi,
      );

      if (log.songId != null && scopedSongIds.has(log.songId)) {
        const noBaseline = windowCoversFullHistory && isFirstScopedRowInWindow;
        rowResultByLogId.set(log.logId, {
          rawAfter: freshTotalBpi,
          rawDelta: noBaseline ? null : freshTotalBpi - prevRawTotalBpi,
          bestAfter: newBestTotalBpi,
          bestDelta:
            noBaseline || prevBestTotalBpi === null
              ? null
              : newBestTotalBpi - prevBestTotalBpi,
          latentSkillAfter: latentSkill,
          latentSkillDelta:
            noBaseline || prevLatentSkill === null || latentSkill === null
              ? null
              : latentSkill - prevLatentSkill,
        });
        isFirstScopedRowInWindow = false;
      }
      prevRawTotalBpi = freshTotalBpi;
      prevBestTotalBpi = newBestTotalBpi;
      prevLatentSkill = latentSkill;
    }
  }

  let lastKnownTotalBpi: number | null = null;
  let lastKnownRawTotalBpi: number | null = null;
  let lastKnownLatentSkill: number | null = null;
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
        const rowResult = rowResultByLogId.get(s.logId);
        return {
          title: `${s.title}${suffix}`,
          prevExScore,
          newExScore: s.exScore,
          prevBpi,
          newBpi,
          rawTotalBpiAfter: rowResult?.rawAfter,
          rawTotalBpiDelta: rowResult?.rawDelta,
          totalBpiAfter: rowResult?.bestAfter,
          totalBpiDelta: rowResult?.bestDelta,
          latentSkillAfter: rowResult?.latentSkillAfter,
          latentSkillDelta: rowResult?.latentSkillDelta,
        };
      });
    if (dayTotalBpi.has(dateStr)) lastKnownTotalBpi = dayTotalBpi.get(dateStr)!;
    if (dayRawTotalBpi.has(dateStr))
      lastKnownRawTotalBpi = dayRawTotalBpi.get(dateStr)!;
    if (dayLatentSkill.has(dateStr))
      lastKnownLatentSkill = dayLatentSkill.get(dateStr)!;
    trend.push({
      date: dateStr,
      totalBpi: lastKnownTotalBpi as number,
      rawTotalBpi: lastKnownRawTotalBpi as number,
      latentSkill: lastKnownLatentSkill,
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
        rawTotalBpi: item.rawTotalBpi,
        latentSkill: item.latentSkill,
        count: item.count,
        updatedSongs: [...item.updatedSongs],
      });
    } else {
      existing.totalBpi = item.totalBpi;
      existing.rawTotalBpi = item.rawTotalBpi;
      existing.latentSkill = item.latentSkill;
      existing.count = item.count;
      existing.updatedSongs.push(...item.updatedSongs);
    }
  }
  return ok(Array.from(grouped.values()));
}
