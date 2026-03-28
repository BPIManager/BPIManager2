import { BpiCalculator } from "../bpi";
import dayjs from "../dayjs";
import { bpiRepo } from "../db/bpi";
import { SongLookup } from "./songLookup";
import { v4 as uuidv4 } from "uuid";

interface BpimScoreHistoryItem {
  title: string;
  difficulty: string;
  exScore: number;
  updatedAt: string;
}

interface BpimScoreMeta {
  title: string;
  difficulty: string;
  clearState: number | string | undefined;
  missCount: number | null | undefined;
}

export interface BpimScoreData {
  scoresHistory: BpimScoreHistoryItem[];
  scores: Record<string, BpimScoreMeta>;
}

interface ScoreUpdate {
  userId: string;
  songId: number;
  definitionId: number;
  exScore: number;
  bpi: number;
  clearState: string;
  missCount: number | null;
  version: string;
  batchId: string;
  lastPlayed: Date;
}

interface StatusLog {
  userId: string;
  totalBpi: number;
  version: string;
  batchId: string;
  createdAt: Date;
}

export class BpiImportService {
  mapClearState = (state: number | string | undefined): string => {
    if (state === undefined) return "NO PLAY";
    const s = Number(state);
    switch (s) {
      case 0:
        return "FAILED";
      case 1:
        return "ASSIST CLEAR";
      case 2:
        return "EASY CLEAR";
      case 3:
        return "CLEAR";
      case 4:
        return "HARD CLEAR";
      case 5:
        return "EX HARD CLEAR";
      case 6:
        return "FULLCOMBO CLEAR";
      case 7:
      default:
        return "NO PLAY";
    }
  };

  async saveMultipleFirestoreData(
    userId: string,
    payloads: { version: string; data: BpimScoreData }[],
  ) {
    const songMaster = await bpiRepo.getSongMasterWithDef();
    const lookup = new SongLookup(songMaster);

    const allScoreUpdates: ScoreUpdate[] = [];
    const allStatusLogs: StatusLog[] = [];
    let latestBpi = -15;

    const dailyGroups = new Map<
      string,
      Map<string, { item: BpimScoreHistoryItem; version: string; meta: BpimScoreMeta | null }>
    >();

    for (const { version, data } of payloads) {
      const scoresHistory: BpimScoreHistoryItem[] = data.scoresHistory || [];
      const scores: Record<string, BpimScoreMeta> = data.scores || {};

      const scoreMetaMap = new Map<string, BpimScoreMeta>();
      Object.values(scores).forEach((s) => {
        const key = `${s.title}_${s.difficulty.toLowerCase()}`;
        scoreMetaMap.set(key, s);
      });

      for (const item of scoresHistory) {
        const d = dayjs(item.updatedAt);
        if (!d.isValid()) continue;
        const dateKey = d.format("YYYY-MM-DD");

        const songKey = `${item.title}_${item.difficulty.toLowerCase()}`;

        if (!dailyGroups.has(dateKey)) {
          dailyGroups.set(dateKey, new Map());
        }

        const dayMap = dailyGroups.get(dateKey)!;
        const existing = dayMap.get(songKey);

        if (
          !existing ||
          new Date(item.updatedAt) > new Date(existing.item.updatedAt)
        ) {
          dayMap.set(songKey, {
            item,
            version,
            meta: scoreMetaMap.get(songKey) || null,
          });
        }
      }
    }

    const sortedDates = Array.from(dailyGroups.keys()).sort();
    const currentProfileBpis = new Map<number, number>();

    for (const date of sortedDates) {
      const batchId = uuidv4();
      const entries = Array.from(dailyGroups.get(date)!.values());

      for (const { item, version, meta } of entries) {
        const songDef = lookup.find(item.title, item.difficulty);
        if (!songDef) continue;

        const bpi = BpiCalculator.calc(item.exScore, songDef);
        if (bpi !== null) {
          allScoreUpdates.push({
            userId,
            songId: songDef.songId,
            definitionId: songDef.defId,
            exScore: item.exScore,
            bpi: bpi,
            clearState: this.mapClearState(meta?.clearState),
            missCount:
              meta?.missCount == null || isNaN(Number(meta.missCount))
                ? null
                : Number(meta.missCount),
            version: version,
            batchId: batchId,
            lastPlayed: dayjs.tz(item.updatedAt).toDate(),
          });

          currentProfileBpis.set(songDef.songId, bpi);
        }
      }

      const allCurrentBpis = Array.from(currentProfileBpis.values());
      const totalBpi = BpiCalculator.calculateTotalBPI(
        allCurrentBpis.sort((a, b) => b - a),
        allCurrentBpis.length,
      );

      latestBpi = totalBpi;

      allStatusLogs.push({
        userId,
        totalBpi,
        version: entries[entries.length - 1].version,
        batchId,
        createdAt: dayjs.tz(`${date} 23:59:59`).toDate(),
      });
    }

    await bpiRepo.importFromBPIM({
      userId,
      scoreUpdates: allScoreUpdates,
      statusLogs: allStatusLogs,
      finalTotalBpi: latestBpi,
    });

    return { totalProcessed: allScoreUpdates.length };
  }
}
