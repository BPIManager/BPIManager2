import { db } from "@/lib/db";
import { SongMaster } from "@/types/songs/songMaster";
import { sql } from "kysely";

export class BpiRepository {
  async getSongMasterWithDef(): Promise<SongMaster> {
    const result = await db
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", "s.songId", "sd.songId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.difficulty",
        "s.difficultyLevel",
        "sd.defId",
        "sd.difficulty",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .where((eb) =>
        eb.or([
          eb("sd.isCurrent", "=", 1),
          eb("sd.updatedAt", "=", (qb) =>
            qb
              .selectFrom("songDef")
              .select(sql<Date>`MAX(updatedAt)`.as("max_date"))
              .whereRef("songId", "=", "s.songId"),
          ),
        ]),
      )
      .execute();
    return result as unknown as SongMaster;
  }

  async getLatestScores(userId: string, version: string) {
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select([
              "songId as l_songId",
              (eb) => eb.fn.max("logId").as("maxLogId"),
            ])
            .where("userId", "=", userId)
            .where("version", "=", version)
            .groupBy("songId")
            .as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .selectAll("s")
      .execute();
  }

  async saveImportResults(params: {
    userId: string;
    version: string;
    batchId: string;
    scoreUpdates: any[];
    newTotalBpi: number;
  }) {
    return await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("logs")
        .values({
          userId: params.userId,
          totalBpi: params.newTotalBpi,
          version: params.version,
          batchId: params.batchId,
        })
        .execute();
      if (params.scoreUpdates.length > 0) {
        await trx.insertInto("scores").values(params.scoreUpdates).execute();
      }
      await trx
        .updateTable("users")
        .set({ currentTotalBpi: params.newTotalBpi })
        .where("userId", "=", params.userId)
        .execute();
    });
  }
}
