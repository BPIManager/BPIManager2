import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

type MasterSong = IBpiBasicSongData & { songId: number };

function toObservations(exScoreBySong: Map<number, number>): IBpiScoreObservation[] {
  return Array.from(exScoreBySong.entries()).map(([songId, exScore]) => ({
    songId,
    notes: 0,
    exScore,
  }));
}

export function buildBpiTimeline(
  preMonthExScoreMap: Map<number, number>,
  inMonthEntries: {
    songId: number;
    exScore: number | null;
    lastPlayed: Date | string;
  }[],
  songMaster: MasterSong[],
  isYearMode: boolean,
): {
  history: { date: string; value: number }[];
  bpiStart: number;
  bpiEnd: number;
  finalExScoreMap: Map<number, number>;
} {
  const songById = new Map(songMaster.map((s) => [s.songId, s]));
  const notesOf = (exScoreBySong: Map<number, number>): IBpiScoreObservation[] =>
    toObservations(exScoreBySong).map((o) => ({
      ...o,
      notes: songById.get(o.songId)?.notes ?? 0,
    }));

  const latestExScoreBySong = new Map(preMonthExScoreMap);

  const bpiStart =
    Math.round(
      BpiCalculator.calculateTotalBPI(
        notesOf(latestExScoreBySong),
        songMaster,
      ) * 100,
    ) / 100;

  // entries は (lastPlayed ASC, logId ASC) 順 → 同日・同曲は後のエントリが勝つ
  const byKey = new Map<string, { songId: number; exScore: number | null }[]>();
  for (const entry of inMonthEntries) {
    const dateStr = dayjs(entry.lastPlayed as Parameters<typeof dayjs>[0])
      .tz()
      .format("YYYY-MM-DD");
    const key = isYearMode ? dateStr.slice(0, 7) : dateStr;
    const arr = byKey.get(key) ?? [];
    arr.push({ songId: entry.songId, exScore: entry.exScore });
    byKey.set(key, arr);
  }

  let currentBpi = bpiStart;
  const historyMap = new Map<string, number>();

  for (const key of Array.from(byKey.keys()).sort()) {
    for (const update of byKey.get(key)!) {
      if (update.exScore != null) {
        latestExScoreBySong.set(update.songId, Number(update.exScore));
      }
    }
    currentBpi =
      Math.round(
        BpiCalculator.calculateTotalBPI(
          notesOf(latestExScoreBySong),
          songMaster,
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
    finalExScoreMap: new Map(latestExScoreBySong),
  };
}
