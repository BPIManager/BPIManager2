import { db } from "@/lib/db";
import { Database, NewScore } from "@/types/db";
import { Transaction, Expression, sql } from "kysely";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";
import {
  latestLogIdPerSongSubquery,
  latestLogIdPerUserSongSubquery,
} from "@/lib/db/shared/latestScore";
/**
 * `scores` テーブル（単曲スコア）の書き込み・基本参照を担当するリポジトリクラス。
 */
class ScoresRepository {
  /**
   * スコアレコードを1件以上挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(trx: Transaction<Database>, values: NewScore | NewScore[]) {
    await trx.insertInto("scores").values(values).execute();
  }

  /**
   * 指定バッチに紐づくスコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param batchId - バッチ ID
   */
  async deleteByBatch(
    trx: Transaction<Database>,
    userId: string,
    batchId: string,
  ) {
    await trx
      .deleteFrom("scores")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ユーザーの全スコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("scores").where("userId", "=", userId).execute();
  }

  /**
   * 指定範囲の前後に存在する`lastPlayed`基準のスコアレコードを取得する
   * （日付ナビゲーション用。`logs`ドメインの`getRangeNavigation`から
   * `groupedBy === "lastPlayed"`の場合に委譲される）。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param range - ナビゲーション基準となる UTC 範囲
   * @returns `{ prevDate, nextDate }`（前後のレコード）
   */
  async getLastPlayedNavigation(
    userId: string,
    version: string,
    range: { start: Date; end: Date },
  ) {
    const { start, end } = range;

    const [prevRow, nextRow] = await Promise.all([
      db
        .selectFrom("scores")
        .select(["lastPlayed"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("lastPlayed", "<", start)
        .orderBy("lastPlayed", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("scores")
        .select(["lastPlayed"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("lastPlayed", ">", end)
        .orderBy("lastPlayed", "asc")
        .executeTakeFirst(),
    ]);

    return {
      prevDate: prevRow,
      nextDate: nextRow,
    };
  }

  /**
   * 指定楽曲の全スコア登録履歴を、プレイ日時の新しい順で取得する。
   *
   * @param userId - ユーザー ID
   * @param songId - 楽曲 ID
   */
  async getHistoryForSong(userId: string, songId: number) {
    return await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId)
      .where("songId", "=", songId)
      .orderBy("lastPlayed", "desc")
      .execute();
  }

  /**
   * バックアップ用にユーザーの全スコアレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * 指定バージョンより前で、直近にスコア登録のあるバージョンを取得する。
   *
   * @param userId - ユーザー ID
   * @param currentVersion - 基準バージョン番号
   * @returns 直近にスコアが存在するバージョン番号、存在しない場合は `null`
   */
  async getPreviousVersionWithScores(
    userId: string,
    currentVersion: string,
  ): Promise<string | null> {
    const versionsOrder: readonly string[] = IIDX_VERSIONS;
    const currentIdx = versionsOrder.indexOf(currentVersion);
    if (currentIdx <= 0) return null;

    const previousVersions = versionsOrder.slice(0, currentIdx);

    const rows = await db
      .selectFrom("scores")
      .select("version")
      .where("userId", "=", userId)
      .where("version", "in", previousVersions)
      .distinct()
      .execute();

    const availableVersions = new Set(rows.map((r) => r.version));

    for (let i = currentIdx - 1; i >= 0; i--) {
      if (availableVersions.has(versionsOrder[i])) {
        return versionsOrder[i];
      }
    }
    return null;
  }

  /**
   * 指定ユーザー・バージョンの `scores` テーブルから、曲ごとの最新スコアを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestScores(userId: string, version: string) {
    return await db
      .selectFrom("scores")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "scores.logId"),
      )
      .selectAll("scores")
      .execute();
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
   * 指定楽曲群について、自分のEXスコアが同バージョンの全ユーザー中で何位かを取得する。
   */
  async getSongRanksForSongs(
    userId: string,
    version: string,
    songIds: number[],
  ): Promise<Map<number, number>> {
    if (songIds.length === 0) return new Map();
    const rows = await db
      .selectFrom((eb) =>
        eb
          .selectFrom((qb) =>
            qb
              .selectFrom("scores as s")
              .innerJoin(
                latestLogIdPerUserSongSubquery({
                  table: "scores",
                  version,
                  songIds,
                }).as("latest"),
                (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
              )
              .select([
                "s.songId",
                "s.userId",
                (eb2) =>
                  eb2.fn
                    .agg<number>("RANK")
                    .over((ob) =>
                      ob.partitionBy("s.songId").orderBy("s.exScore", "desc"),
                    )
                    .as("rnk"),
              ])
              .where("s.songId", "in", songIds)
              .as("ranked"),
          )
          .selectAll()
          .where("userId", "=", userId)
          .as("mine"),
      )
      .select(["songId", "rnk"])
      .execute();
    const map = new Map<number, number>();
    for (const r of rows) map.set(r.songId, Number(r.rnk));
    return map;
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

/**
 * `scores` テーブル（単曲スコア）の基本CRUD・参照を提供するリポジトリのインスタンス。
 *
 * スコア詳細クエリ（比較・曲定義結合）は{@link scoreDetailRepo}、
 * 自己タイムライン系は{@link timelineRepo}を利用する。
 */
export const scoresRepo = new ScoresRepository();
