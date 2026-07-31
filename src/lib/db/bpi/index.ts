import { db } from "@/lib/db";
import { Database, NewAllScores, NewScore, NewTotalBPILog } from "@/types/db";
import { Transaction } from "kysely";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { userStatusLogsRepo } from "@/lib/db/userStatusLogs";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore";

/**
 * BPI スコアのインポートおよびスコアマスタ参照を担当するリポジトリクラス。
 */
class BpiRepository {
  private async getLatestFromTable(
    userId: string,
    version: string,
    tableName: "scores" | "allScores",
  ) {
    return await db
      .selectFrom(tableName as "scores" | "allScores")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: tableName,
          userId,
          version,
        }).as("latest"),
        (join) =>
          join.onRef("latest.maxLogId", "=", `${tableName}.logId` as never),
      )
      .selectAll(tableName as "scores" | "allScores")
      .execute();
  }

  /**
   * 指定ユーザー・バージョンの `scores` テーブルから、曲ごとの最新スコアを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestScores(userId: string, version: string) {
    return await this.getLatestFromTable(userId, version, "scores");
  }

  /**
   * 指定ユーザー・バージョンの `allScores` テーブルから、曲ごとの最新スコアを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestAllScores(userId: string, version: string) {
    return await this.getLatestFromTable(userId, version, "allScores");
  }

  /**
   * 指定ユーザー・バージョン・楽曲の最新スコアを1件取得する。
   * idx_scores_version_user_song_log(version,userId,songId,logId DESC) を点引きする。
   */
  async getLatestScoreForSong(userId: string, songId: number, version: string) {
    return await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId)
      .where("songId", "=", songId)
      .where("version", "=", version)
      .orderBy("logId", "desc")
      .limit(1)
      .executeTakeFirst();
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

  /**
   * スコアインポート結果をトランザクション内で保存する。
   *
   * `scores`・`logs`・`userStatusLogs` の更新と、`allScores` の追記を一括で行う。
   *
   * @param params.userId - ユーザー ID
   * @param params.version - バージョン番号
   * @param params.batchId - バッチ ID（インポートのひとまとまりを識別する UUID）
   * @param params.scoreUpdates - 保存する BPI スコアの配列
   * @param params.allScoreUpdates - 保存する全難易度スコアの配列
   * @param params.newTotalBpi - 今回算出した総合 BPI
   */
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
      await userStatusLogsRepo.deleteByUser(trx, params.userId);

      if (params.statusLogs.length > 0) {
        await userStatusLogsRepo.insert(trx, params.statusLogs);
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
    const latestLog = await userStatusLogsRepo.getLatestArenaRank(
      trx,
      params.userId,
      params.version,
    );

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

      await userStatusLogsRepo.insert(trx, {
        userId: params.userId,
        totalBpi: params.newTotalBpi,
        arenaRank: currentArenaRank,
        version: params.version,
        batchId: params.batchId,
      });

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

  /**
   * BPIM内での指定スコアの順位と登録者総数を返す。
   * 同バージョンのユーザーごとの最新スコアを対象とする。
   */
  async getSongBpimRank(
    songId: number,
    exScore: number,
    version: string = latestVersion,
  ): Promise<{ rank: number; total: number }> {
    const latest = db
      .selectFrom("scores")
      .select(["userId", (eb) => eb.fn.max("logId").as("maxLogId")])
      .where("songId", "=", songId)
      .where("version", "=", version)
      .groupBy("userId")
      .as("latest");

    const row = await db
      .selectFrom("scores as s")
      .innerJoin(latest, (join) =>
        join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select((eb) => [
        eb.fn.countAll<number>().as("total"),
        eb.fn
          .sum(
            eb
              .case()
              .when(eb("s.exScore", ">", exScore))
              .then(eb.lit(1))
              .else(eb.lit(0))
              .end(),
          )
          .as("above"),
      ])
      .where("s.songId", "=", songId)
      .executeTakeFirst();

    return {
      rank: Number(row?.above ?? 0) + 1,
      total: Number(row?.total ?? 0),
    };
  }
}

export const bpiRepo = new BpiRepository();
