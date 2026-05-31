import { db } from "@/lib/db";
import { SongMaster } from "@/types/songs/master";
import { Database, NewAllScores, NewScore, NewTotalBPILog } from "@/types/db";
import { Transaction } from "kysely";
import { latestVersion } from "@/constants/latestVersion";

/**
 * BPI スコアのインポートおよびスコアマスタ参照を担当するリポジトリクラス。
 */
class BpiRepository {
  /**
   * 現在有効な曲定義（`songDef.isCurrent = 1`）を結合した楽曲マスタを取得する。
   *
   * @returns 楽曲 ID・タイトル・ノーツ数・難易度・皆伝平均・WR スコア・補正係数を含む配列
   */
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

  /**
   * 全難易度の楽曲マスタ（`allSongs` テーブル）を取得する。
   *
   * @returns 楽曲 ID・タイトル・ノーツ数・難易度・BPM・textage を含む配列
   */
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
      .where("version", "=", params.version)
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

  /**
   * title + difficulty で楽曲と最新 songDef を取得する。
   * 削除済み楽曲は除外。
   */
  async getSongWithDefByTitleDifficulty(title: string, difficulty: string) {
    return await db
      .selectFrom("songs as s")
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("songDef")
            .select(["songId", "wrScore", "kaidenAvg", "coef"])
            .where("isCurrent", "=", 1)
            .as("def"),
        (join) => join.onRef("def.songId", "=", "s.songId"),
      )
      .select([
        "s.songId",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "def.wrScore",
        "def.kaidenAvg",
        "def.coef",
      ])
      .where("s.title", "=", title)
      .where("s.difficulty", "=", difficulty)
      .where((eb) =>
        eb.or([
          eb("s.deletedAt", "is", null),
          eb("s.deletedAt", ">", latestVersion),
        ]),
      )
      .executeTakeFirst();
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
    const makeLatest = () =>
      db
        .selectFrom("scores")
        .select(["userId", (eb) => eb.fn.max("logId").as("maxLogId")])
        .where("songId", "=", songId)
        .where("version", "=", version)
        .groupBy("userId")
        .as("latest");

    const [aboveRow, totalRow] = await Promise.all([
      db
        .selectFrom("scores as s")
        .innerJoin(makeLatest(), (join) =>
          join.onRef("latest.maxLogId", "=", "s.logId"),
        )
        .select((eb) => eb.fn.count("s.userId").as("cnt"))
        .where("s.songId", "=", songId)
        .where("s.exScore", ">", exScore)
        .executeTakeFirst(),

      db
        .selectFrom("scores as s")
        .innerJoin(makeLatest(), (join) =>
          join.onRef("latest.maxLogId", "=", "s.logId"),
        )
        .select((eb) => eb.fn.count("s.userId").as("cnt"))
        .where("s.songId", "=", songId)
        .executeTakeFirst(),
    ]);

    return {
      rank: Number(aboveRow?.cnt ?? 0) + 1,
      total: Number(totalRow?.cnt ?? 0),
    };
  }
}

export const bpiRepo = new BpiRepository();
