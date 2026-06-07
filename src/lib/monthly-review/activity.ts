import dayjs from "@/lib/dayjs";

type TowerRow = { playDate: unknown; keyCount: unknown; scratchCount: unknown };
type BreakdownRow = { dow: unknown; hour: unknown; count: unknown };

export function toPlayDateStr(val: unknown): string {
  if (val instanceof Date) return dayjs(val).format("YYYY-MM-DD");
  if (typeof val === "string") return val.slice(0, 10);
  return "1970-01-01";
}

export function buildActivityBreakdown(breakdownRows: BreakdownRow[]) {
  const dowMap = new Map<number, number>();
  const hourMap = new Map<number, number>();
  for (const row of breakdownRows) {
    const mysqlDow = Number(row.dow);
    const appDow = mysqlDow === 1 ? 6 : mysqlDow - 2;
    dowMap.set(appDow, (dowMap.get(appDow) ?? 0) + Number(row.count));
    const h = Number(row.hour);
    hourMap.set(h, (hourMap.get(h) ?? 0) + Number(row.count));
  }
  const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    count: dowMap.get(i) ?? 0,
  }));
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap.get(h) ?? 0,
  }));
  return { byDayOfWeek, byHour };
}

export function buildBestDays(
  dailyTowerData: TowerRow[],
  bpiHistory: { date: string; value: number }[],
  bpiStart: number,
) {
  const bestKeysDay =
    dailyTowerData.length > 0
      ? dailyTowerData.reduce((best, d) =>
          Number(d.keyCount) > Number(best.keyCount) ? d : best,
        )
      : null;
  const bestScratchDay =
    dailyTowerData.length > 0
      ? dailyTowerData.reduce((best, d) =>
          Number(d.scratchCount) > Number(best.scratchCount) ? d : best,
        )
      : null;

  let bestGrowthDay: { date: string; bpiDiff: number } | null = null;
  let prevBpi = bpiStart;
  for (const h of bpiHistory) {
    const diff = Math.round((h.value - prevBpi) * 100) / 100;
    if (diff > 0 && (bestGrowthDay === null || diff > bestGrowthDay.bpiDiff)) {
      bestGrowthDay = { date: h.date, bpiDiff: diff };
    }
    prevBpi = h.value;
  }

  return {
    bestGrowthDay,
    bestKeysDay: bestKeysDay
      ? {
          date: toPlayDateStr(bestKeysDay.playDate),
          keyCount: Number(bestKeysDay.keyCount),
        }
      : null,
    bestScratchDay: bestScratchDay
      ? {
          date: toPlayDateStr(bestScratchDay.playDate),
          scratchCount: Number(bestScratchDay.scratchCount),
        }
      : null,
  };
}
