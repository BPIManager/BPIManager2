import { db } from "@/lib/db";
import { SongMaster } from "@/types/songs/songMaster";
import { Database, NewAllScores, NewScore, NewTotalBPILog } from "@/types/sql";
import { Transaction } from "kysely";

class BpiRepository {
  async getSongMasterWithDef(): Promise<SongMaster> {
    const result = await db
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
      )
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
      .execute();
    return result as SongMaster;
  }

  async getAllLevelMaster(): Promise<
    {
      songId: number;
      title: string;
      notes: number;
      difficulty: string;
      difficultyLevel: number;
      bpm: string;
      textage: string;
    }[]
  > {
    return await db
      .selectFrom("allSongs")
      .select([
        "songId",
        "title",
        "notes",
        "difficulty",
        "difficultyLevel",
        "bpm",
        "textage",
      ])
      .execute();
  }

  private async getLatestFromTable(
    userId: string,
    version: string,
    tableName: "scores" | "allScores",
  ) {
    return await db
      .selectFrom(tableName as "scores" | "allScores")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom(tableName as "scores" | "allScores")
            .select([
              "songId as l_songId",
              (eb) => eb.fn.max("logId").as("maxLogId"),
            ])
            .where("userId", "=", userId)
            .where("version", "=", version)
            .groupBy("songId")
            .as("latest"),
        (join) =>
          join.onRef("latest.maxLogId", "=", `${tableName}.logId` as never),
      )
      .selectAll(tableName as "scores" | "allScores")
      .execute();
  }

  async getLatestScores(userId: string, version: string) {
    return await this.getLatestFromTable(userId, version, "scores");
  }

  async getLatestAllScores(userId: string, version: string) {
    return await this.getLatestFromTable(userId, version, "allScores");
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
    allScoreUpdates: NewAllScores[];
    newTotalBpi: number;
  }) {
    return await db.transaction().execute(async (trx) => {
      await this.executeSaveBpiSystem(trx, params);
      await this.executeSaveAllLevelHistory(trx, params);
    });
  }

  /**
   * BPIManagerからの引き継ぎインポート
   */
  async importFromBPIM(params: {
    userId: string;
    scoreUpdates: NewScore[];
    statusLogs: NewTotalBPILog[];
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
  private async executeSaveBpiSystem(
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
    if (params.scoreUpdates.length > 0) {
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

      await trx.insertInto("scores").values(params.scoreUpdates).execute();
    }
  }

  private async executeSaveAllLevelHistory(
    trx: Transaction<Database>,
    params: { allScoreUpdates: NewAllScores[] },
  ) {
    if (params.allScoreUpdates.length === 0) return;

    const chunks = [];
    for (let i = 0; i < params.allScoreUpdates.length; i += 1000) {
      chunks.push(params.allScoreUpdates.slice(i, i + 1000));
    }
    for (const chunk of chunks) {
      await trx.insertInto("allScores").values(chunk).execute();
    }
  }
}

export const bpiRepo = new BpiRepository();
