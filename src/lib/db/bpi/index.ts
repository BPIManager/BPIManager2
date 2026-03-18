import { db } from "@/lib/db";
import { SongMaster } from "@/types/songs/songMaster";
import { Database, NewScore } from "@/types/sql";
import { sql, Transaction } from "kysely";

class BpiRepository {
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

  /**
   * 指定したユーザー・バージョンの最新のバッチログを取得する
   */
  async getLatestTotalBpi(userId: string, version: string) {
    return await db
      .selectFrom("logs")
      .select("totalBpi")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  async saveImportResults(params: {
    userId: string;
    version: string;
    batchId: string;
    scoreUpdates: NewScore[];
    newTotalBpi: number;
  }) {
    return await db.transaction().execute(async (trx) => {
      await this.executeSave(trx, params);
    });
  }

  /**
   * BPIManagerからの引き継ぎインポート
   */
  async importFromBPIM(params: {
    userId: string;
    scoreUpdates: any[];
    statusLogs: any[];
    finalTotalBpi: number;
  }) {
    return await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("scores")
        .where("userId", "=", params.userId)
        .execute();
      await trx
        .deleteFrom("logs")
        .where("userId", "=", params.userId)
        .execute();
      await trx
        .deleteFrom("userStatusLogs")
        .where("userId", "=", params.userId)
        .execute();

      if (params.statusLogs.length > 0) {
        await trx
          .insertInto("userStatusLogs")
          .values(params.statusLogs)
          .execute();
        await trx.insertInto("logs").values(params.statusLogs).execute();
      }

      if (params.scoreUpdates.length > 0) {
        const chunks = [];
        for (let i = 0; i < params.scoreUpdates.length; i += 1000) {
          chunks.push(params.scoreUpdates.slice(i, i + 1000));
        }
        for (const chunk of chunks) {
          await trx.insertInto("scores").values(chunk).execute();
        }
      }
    });
  }

  /**
   * 共通保存ロジック
   */
  private async executeSave(
    trx: Transaction<Database>,
    params: {
      userId: string;
      version: string;
      batchId: string;
      scoreUpdates: NewScore[];
      newTotalBpi: number;
    },
  ) {
    const latestLog = await trx
      .selectFrom("userStatusLogs")
      .select("arenaRank")
      .where("userId", "=", params.userId)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();

    const currentArenaRank = latestLog?.arenaRank ?? null;

    await trx
      .insertInto("logs")
      .values({
        userId: params.userId,
        totalBpi: params.newTotalBpi,
        version: params.version,
        batchId: params.batchId,
      })
      .execute();

    await trx
      .insertInto("userStatusLogs")
      .values({
        userId: params.userId,
        totalBpi: params.newTotalBpi,
        arenaRank: currentArenaRank,
        version: params.version,
        batchId: params.batchId,
      })
      .execute();

    if (params.scoreUpdates.length > 0) {
      await trx.insertInto("scores").values(params.scoreUpdates).execute();
    }
  }
}

export const bpiRepo = new BpiRepository();
