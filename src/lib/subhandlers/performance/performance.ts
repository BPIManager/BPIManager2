import { scoreActivityRepo } from "@/lib/db/domains/scores/activity";
import { iidxTowerRepo } from "@/lib/db/domains/iidxTower";
import { performanceRepo } from "@/lib/db/aggregates/performance";
import {
  jstDayStart,
  jstDayEnd,
} from "@/lib/db/aggregates/monthly-review/dates";
import { calcSessionBpi } from "@/lib/bpi/sessionBpi";
import { toPlayDateStr } from "@/lib/monthly-review/activity";
import { ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { IIDXVersion } from "@/types/iidx/version";
import type { PerformanceDay } from "@/types/logs/performance";

/** 比較用に返す過去プレイ日数の上限 */
const PAST_DAYS_LIMIT = 30;

/** GET stats/performance */
export async function handleStatsPerformance(q: {
  userId: string;
  version: IIDXVersion;
  date: string;
}): Promise<HandlerResult<unknown>> {
  const [plays, summaries] = await Promise.all([
    performanceRepo.getPlaysInRange(
      q.userId,
      q.version,
      jstDayStart(q.date),
      jstDayEnd(q.date),
    ),
    scoreActivityRepo.getDailyPlaySummaries(
      q.userId,
      q.version,
      jstDayEnd(q.date),
      PAST_DAYS_LIMIT + 1,
    ),
  ]);

  const towerStart = summaries.length
    ? summaries[summaries.length - 1].playDate
    : q.date;
  const [towerRows, lv12Rows] = await Promise.all([
    iidxTowerRepo.getDailyInRange(
      q.userId,
      q.version,
      new Date(`${towerStart}T00:00:00Z`),
      new Date(`${q.date}T00:00:00Z`),
    ),
    performanceRepo.getLevel12BpisInRange(
      q.userId,
      q.version,
      jstDayStart(towerStart),
      jstDayEnd(q.date),
    ),
  ]);
  const bpisByDate = new Map<string, number[]>();
  for (const r of lv12Rows) {
    bpisByDate.set(r.playDate, [...(bpisByDate.get(r.playDate) ?? []), r.bpi]);
  }
  const towerByDate = new Map(
    towerRows.map((r) => [toPlayDateStr(r.playDate), r]),
  );

  const toDay = (s: (typeof summaries)[number]): PerformanceDay => {
    const tower = towerByDate.get(s.playDate);
    return {
      date: s.playDate,
      songCount: s.songCount,
      firstPlayedAt: s.firstPlayedAt,
      lastPlayedAt: s.lastPlayedAt,
      playMinutes: Math.round((s.lastPlayedAt - s.firstPlayedAt) / 60000),
      sessionBpi: calcSessionBpi(bpisByDate.get(s.playDate) ?? []),
      keyCount: tower ? Number(tower.keyCount) : null,
      scratchCount: tower ? Number(tower.scratchCount) : null,
    };
  };

  const targetSummary = summaries.find((s) => s.playDate === q.date);
  return ok({
    date: q.date,
    plays,
    target: targetSummary ? toDay(targetSummary) : null,
    past: summaries
      .filter((s) => s.playDate < q.date)
      .slice(0, PAST_DAYS_LIMIT)
      .map(toDay),
    hasTowerData: towerByDate.has(q.date),
  });
}
