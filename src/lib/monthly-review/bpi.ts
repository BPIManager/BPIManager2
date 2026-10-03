import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";
import type {
  IBpiBasicSongData,
  IBpiScoreObservation,
} from "@/types/songs/bpi";

type MasterSong = IBpiBasicSongData & { songId: number };

function toObservations(
  exScoreBySong: Map<number, number>,
): IBpiScoreObservation[] {
  return Array.from(exScoreBySong.entries()).map(([songId, exScore]) => ({
    songId,
    notes: 0,
    exScore,
  }));
}

/** 特定バージョンのスコア群から独立して総合BPIを1件計算する（バージョン間比較のbaseline用） */
export function calculateTotalBpiForScores(
  exScoreBySong: Map<number, number>,
  songMaster: MasterSong[],
): number {
  const songById = new Map(songMaster.map((s) => [s.songId, s]));
  const observations = toObservations(exScoreBySong).map((o) => ({
    ...o,
    notes: songById.get(o.songId)?.notes ?? 0,
  }));
  return (
    Math.round(
      BpiCalculator.calculateTotalBPI(observations, songMaster) * 100,
    ) / 100
  );
}

export function buildBpiTimeline(
  preMonthExScoreMap: Map<number, number>,
  inMonthEntries: {
    songId: number;
    exScore: number | null;
    lastPlayed: Date | string;
  }[],
  songMaster: MasterSong[],
  useMonthBuckets: boolean,
  priorRecordedMax: number | null = null,
  inRangeRecordedLogs: { createdAt: Date | string; totalBpi: number }[] = [],
): {
  history: { date: string; value: number }[];
  bpiStart: number;
  bpiEnd: number;
  finalExScoreMap: Map<number, number>;
} {
  const songById = new Map(songMaster.map((s) => [s.songId, s]));
  const notesOf = (
    exScoreBySong: Map<number, number>,
  ): IBpiScoreObservation[] =>
    toObservations(exScoreBySong).map((o) => ({
      ...o,
      notes: songById.get(o.songId)?.notes ?? 0,
    }));

  const latestExScoreBySong = new Map(preMonthExScoreMap);

  const rawBpiStart =
    Math.round(
      BpiCalculator.calculateTotalBPI(
        notesOf(latestExScoreBySong),
        songMaster,
      ) * 100,
    ) / 100;
  const bpiStart = BpiCalculator.ratchetTotalBpi(priorRecordedMax, rawBpiStart);

  // entries は (lastPlayed ASC, logId ASC) 順 → 同日・同曲は後のエントリが勝つ
  const byKey = new Map<string, { songId: number; exScore: number | null }[]>();
  for (const entry of inMonthEntries) {
    const dateStr = dayjs(entry.lastPlayed as Parameters<typeof dayjs>[0])
      .tz()
      .format("YYYY-MM-DD");
    const key = useMonthBuckets ? dateStr.slice(0, 7) : dateStr;
    const arr = byKey.get(key) ?? [];
    arr.push({ songId: entry.songId, exScore: entry.exScore });
    byKey.set(key, arr);
  }

  const recordedFloorByKey = new Map<string, number>();
  for (const log of inRangeRecordedLogs) {
    const dateStr = dayjs(log.createdAt as Parameters<typeof dayjs>[0])
      .tz()
      .format("YYYY-MM-DD");
    const key = useMonthBuckets ? dateStr.slice(0, 7) : dateStr;
    const existing = recordedFloorByKey.get(key);
    if (existing === undefined || log.totalBpi > existing) {
      recordedFloorByKey.set(key, log.totalBpi);
    }
  }

  const allKeys = new Set<string>([
    ...byKey.keys(),
    ...recordedFloorByKey.keys(),
  ]);

  let currentBpi = bpiStart;
  let recordedFloorSoFar = bpiStart;
  const historyMap = new Map<string, number>();

  for (const key of Array.from(allKeys).sort()) {
    const recordedAtKey = recordedFloorByKey.get(key);
    if (recordedAtKey !== undefined && recordedAtKey > recordedFloorSoFar) {
      recordedFloorSoFar = recordedAtKey;
    }
    for (const update of byKey.get(key) ?? []) {
      if (update.exScore != null) {
        latestExScoreBySong.set(update.songId, Number(update.exScore));
      }
    }
    const rawBpi =
      Math.round(
        BpiCalculator.calculateTotalBPI(
          notesOf(latestExScoreBySong),
          songMaster,
        ) * 100,
      ) / 100;
    currentBpi = Math.max(
      recordedFloorSoFar,
      BpiCalculator.ratchetTotalBpi(currentBpi, rawBpi),
    );
    historyMap.set(key, currentBpi);
  }

  const history = Array.from(historyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      date: useMonthBuckets ? `${key}-01` : key,
      value,
    }));

  return {
    history,
    bpiStart,
    bpiEnd: currentBpi,
    finalExScoreMap: new Map(latestExScoreBySong),
  };
}
