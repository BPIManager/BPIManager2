import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";

export function buildBpiTimeline(
  preMonthBpiMap: Map<number, number>,
  inMonthEntries: {
    songId: number;
    bpi: number | null;
    lastPlayed: Date | string;
  }[],
  totalSongs: number,
  isYearMode: boolean,
): {
  history: { date: string; value: number }[];
  bpiStart: number;
  bpiEnd: number;
  finalBpiMap: Map<number, number>;
} {
  const latestBpisBySong = new Map(preMonthBpiMap);

  const bpiStart =
    Math.round(
      BpiCalculator.calculateTotalBPI(
        Array.from(latestBpisBySong.values()),
        totalSongs,
      ) * 100,
    ) / 100;

  // entries は (lastPlayed ASC, logId ASC) 順 → 同日・同曲は後のエントリが勝つ
  const byKey = new Map<string, { songId: number; bpi: number | null }[]>();
  for (const entry of inMonthEntries) {
    const dateStr = dayjs(entry.lastPlayed as Parameters<typeof dayjs>[0])
      .tz()
      .format("YYYY-MM-DD");
    const key = isYearMode ? dateStr.slice(0, 7) : dateStr;
    const arr = byKey.get(key) ?? [];
    arr.push({ songId: entry.songId, bpi: entry.bpi });
    byKey.set(key, arr);
  }

  let currentBpi = bpiStart;
  const historyMap = new Map<string, number>();

  for (const key of Array.from(byKey.keys()).sort()) {
    for (const update of byKey.get(key)!) {
      latestBpisBySong.set(
        update.songId,
        update.bpi != null ? Number(update.bpi) : -15,
      );
    }
    currentBpi =
      Math.round(
        BpiCalculator.calculateTotalBPI(
          Array.from(latestBpisBySong.values()),
          totalSongs,
        ) * 100,
      ) / 100;
    historyMap.set(key, currentBpi);
  }

  const history = Array.from(historyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ date: isYearMode ? `${key}-01` : key, value }));

  return {
    history,
    bpiStart,
    bpiEnd: currentBpi,
    finalBpiMap: new Map(latestBpisBySong),
  };
}
