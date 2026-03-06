import { NewScore } from "@/types/sql";
import { BpiCalculator } from "../bpi";
import { BpiRepository } from "../db/bpi";
import { SongLookup } from "./songLookup";
import { v4 as uuidv4 } from "uuid";

export class BpiImportService {
  constructor(private repo: BpiRepository) {}

  async saveMultipleFirestoreData(
    userId: string,
    payloads: { version: string; data: any }[],
  ) {
    const songMaster = await this.repo.getSongMasterWithDef();
    const lookup = new SongLookup(songMaster);

    const allScoreUpdates: any[] = [];
    const allStatusLogs: any[] = [];
    let latestBpi = -15;

    const sortedPayloads = payloads.sort(
      (a, b) => parseInt(a.version) - parseInt(b.version),
    );

    for (const { version, data } of sortedPayloads) {
      const scoresHistory = data.scoresHistory || [];
      const batchId = uuidv4();
      const currentVersionBpis: number[] = [];

      for (const item of scoresHistory) {
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
            version: version,
            batchId: batchId,
            lastPlayed: new Date(item.updatedAt.replace(/-/g, "/")),
          });
          currentVersionBpis.push(bpi);
        }
      }

      const totalBpi = BpiCalculator.calculateTotalBPI(
        currentVersionBpis.sort((a, b) => b - a),
        currentVersionBpis.length,
      );

      latestBpi = totalBpi;

      allStatusLogs.push({
        userId,
        totalBpi,
        version,
        batchId,
        createdAt: data.timeStamp
          ? new Date(data.timeStamp.replace(/-/g, "/"))
          : new Date(),
      });
    }

    await this.repo.importFromBPIM({
      userId,
      scoreUpdates: allScoreUpdates,
      statusLogs: allStatusLogs,
      finalTotalBpi: latestBpi,
    });

    return { totalProcessed: allScoreUpdates.length };
  }
}
