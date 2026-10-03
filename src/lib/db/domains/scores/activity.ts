import { db } from "@/lib/db";

import { Expression, sql } from "kysely";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore/perSong";
/**
 * `scores` テーブルの期間別・バッチ別の集計（活動量・ランキング用）を担当するリポジトリクラス。
 */
class ScoreActivityRepository {
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

  /**
   * 指定バージョン群を除外した `scores` レコード件数を取得する。
   * `onJstDate` 指定時はその日(JST)に作成されたレコード件数に絞り込む。
   *
   * @param excludeVersions - 除外するバージョン番号の配列
   * @param onJstDate - `DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))` と比較するSQL式
   */
  async getCountExcludingVersions(
    excludeVersions: readonly string[],
    onJstDate?: Expression<unknown>,
  ): Promise<number> {
    let query = db
      .selectFrom("scores")
      .select((eb) => eb.fn.count("logId").as("count"))
      .where("version", "not in", excludeVersions as string[]);
    if (onJstDate) {
      query = query.where(
        sql`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
        "=",
        onJstDate,
      );
    }
    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  /**
   * 指定期間内に最終プレイのあったバッチIDと、そのバッチの最終プレイ日を取得する。
   */
  async getBatchesWithLastPlayedInRange(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ): Promise<{ batchId: string; playDate: string }[]> {
    return (await db
      .selectFrom("scores")
      .select([
        "batchId",
        sql<string>`DATE_FORMAT(MAX(CONVERT_TZ(lastPlayed, '+00:00', '+09:00')), '%Y-%m-%d')`.as(
          "playDate",
        ),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("lastPlayed", ">=", start)
      .where("lastPlayed", "<=", end)
      .where("batchId", "is not", null)
      .groupBy("batchId")
      .execute()) as { batchId: string; playDate: string }[];
  }

  /**
   * 指定日時より前における、指定楽曲群の最新スコア（EXスコア・BPI）を取得する。
   */
  async getLatestExScoresForSongsBeforeDate(
    userId: string,
    version: string,
    songIds: number[],
    beforeDate: Date,
  ) {
    if (songIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
          extra: (qb) =>
            qb.where("songId", "in", songIds).where("lastPlayed", "<", beforeDate),
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.bpi", "s.exScore"])
      .execute();
  }

  /**
   * 指定期間内の最終プレイ日時を曜日・時間帯別に集計する（プレイ済み楽曲数ベース）。
   */
  async getActivityBreakdownByLastPlayed(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    return await db
      .selectFrom("scores as s")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as(
          "dow",
        ),
        sql<number>`HOUR(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as(
          "hour",
        ),
        sql<number>`COUNT(DISTINCT s.songId)`.as("count"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.lastPlayed", ">=", start)
      .where("s.lastPlayed", "<=", end)
      .groupBy(["dow", "hour"])
      .execute();
  }

  /**
   * 指定ユーザー・バージョンでスコア登録のある年月一覧を新しい順で返す。
   */
  async getAvailableMonths(userId: string, version: string): Promise<string[]> {
    const rows = await db
      .selectFrom("scores")
      .select(
        sql<string>`DATE_FORMAT(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'), '%Y-%m')`.as(
          "month",
        ),
      )
      .where("userId", "=", userId)
      .where("version", "=", version)
      .groupBy(
        sql`DATE_FORMAT(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'), '%Y-%m')`,
      )
      .orderBy(sql`month`, "desc")
      .execute();
    return rows.map((r) => r.month);
  }
}

export const scoreActivityRepo = new ScoreActivityRepository();
