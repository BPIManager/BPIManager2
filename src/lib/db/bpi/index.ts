import { db } from "@/lib/db";
import { latestVersion } from "@/constants/iidx/iidxVersions";
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
