import { db } from "@/lib/db";
import { Database, NewUserStatusLog } from "@/types/db";
import { Kysely, Transaction } from "kysely";

/**
 * `userStatusLogs` テーブル（バージョン別の総合BPI・アリーナランク履歴）の
 * 書き込みを担当するリポジトリクラス。
 */
class UserStatusLogsRepository {
  /**
   * 指定ユーザー・バージョンの最新行から `arenaRank` を取得する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestArenaRank(
    trx: Transaction<Database>,
    userId: string,
    version: string,
  ) {
    return await trx
      .selectFrom("userStatusLogs")
      .select("arenaRank")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザー・バージョンの最新行から `totalBpi` を取得する。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestTotalBpi(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
  ) {
    return await trx
      .selectFrom("userStatusLogs")
      .select("totalBpi")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザー・バージョンでこれまでに記録された総合BPIの最高値を取得する。
   * 総合BPIの「下がらないラチェット」（{@link BpiCalculator.ratchetTotalBpi}）の
   * 基準値として使う。`getLatestTotalBpi`（最新1件）とは異なり、途中に
   * ラチェット導入前の下振れがあっても影響されない。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @returns 記録が無ければ `null`
   */
  async getMaxTotalBpi(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
  ): Promise<number | null> {
    const row = await trx
      .selectFrom("userStatusLogs")
      .select((eb) => eb.fn.max("totalBpi").as("maxTotalBpi"))
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
    return row?.maxTotalBpi != null ? Number(row.maxTotalBpi) : null;
  }

  /**
   * 指定ユーザー・バージョンで、指定時点(`asOf`)までに記録された総合BPIの最高値を取得する。
   * {@link getMaxTotalBpi}の時点限定版。月間振り返りのように過去の一時点を基準に
   * ラチェットの下限を求める場合は、全期間の最大値ではなくこちらを使う
   * （全期間の最大値を使うと、その時点より後に記録された最高値で過去の値が
   * 不自然に引き上げられてしまう）。
   *
   * @param trx - 呼び出し元が管理するトランザクション（トランザクション外から
   *   呼ぶ場合は `db` をそのまま渡す）
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param asOf - この時点（`createdAt`基準）までの記録に限定する
   * @returns 記録が無ければ `null`
   */
  async getMaxTotalBpiAsOf(
    trx: Kysely<Database> | Transaction<Database>,
    userId: string,
    version: string,
    asOf: Date,
  ): Promise<number | null> {
    const row = await trx
      .selectFrom("userStatusLogs")
      .select((eb) => eb.fn.max("totalBpi").as("maxTotalBpi"))
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", "<=", asOf)
      .executeTakeFirst();
    return row?.maxTotalBpi != null ? Number(row.maxTotalBpi) : null;
  }

  /**
   * {@link getMaxTotalBpiAsOf}の複数ユーザー一括版。ライバル戦線等で複数ユーザーの
   * 総合BPI推移をまとめて再計算する際に使う。
   *
   * @param userIds - ユーザーIDの配列
   * @param version - バージョン番号
   * @param asOf - この時点（`createdAt`基準）までの記録に限定する
   * @returns userId→記録された最高値のMap（記録が無いユーザーは含まれない）
   */
  /**
   * {@link getMaxTotalBpi} の非トランザクション版。呼び出し元が `db` を import せずに
   * 記録済みの最高値を参照するためのもの。
   */
  async findMaxTotalBpi(userId: string, version: string): Promise<number | null> {
    return this.getMaxTotalBpi(db, userId, version);
  }

  /**
   * {@link getMaxTotalBpiAsOf} の非トランザクション版（呼び出し元が `db` を import しないため）。
   */
  async findMaxTotalBpiAsOf(
    userId: string,
    version: string,
    asOf: Date,
  ): Promise<number | null> {
    return this.getMaxTotalBpiAsOf(db, userId, version, asOf);
  }

  async getMaxTotalBpiAsOfForUsers(
    userIds: string[],
    version: string,
    asOf: Date,
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const rows = await db
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("totalBpi").as("maxTotalBpi")])
      .where("userId", "in", userIds)
      .where("version", "=", version)
      .where("createdAt", "<=", asOf)
      .groupBy("userId")
      .execute();
    return new Map(
      rows
        .filter((r) => r.maxTotalBpi != null)
        .map((r) => [r.userId, Number(r.maxTotalBpi)]),
    );
  }

  /**
   * 指定ユーザー・バージョンで、`createdAt`が[from, to]の範囲にある総合BPI記録を取得する。
   * 月間振り返りの再計算（{@link buildBpiTimeline}）で、月内に実際に記録された
   * （記録時点でラチェット済みの）値を下限として合流させるために使う
   * （{@link getMaxTotalBpiAsOf}は期間開始時点の下限のみで、期間中のBPIモデル再推定
   * による下振れはカバーしない）。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param from - この時点（`createdAt`基準）より後の記録に限定する
   * @param to - この時点（`createdAt`基準）以前の記録に限定する
   */
  async getTotalBpiLogsInRange(
    userId: string,
    version: string,
    from: Date,
    to: Date,
  ): Promise<{ createdAt: Date; totalBpi: number }[]> {
    const rows = await db
      .selectFrom("userStatusLogs")
      .select(["createdAt", "totalBpi"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", ">", from)
      .where("createdAt", "<=", to)
      .orderBy("id", "asc")
      .execute();
    return rows.map((r) => ({
      createdAt: r.createdAt,
      totalBpi: Number(r.totalBpi),
    }));
  }

  /**
   * {@link getTotalBpiLogsInRange}の複数ユーザー一括版。
   *
   * @param userIds - ユーザーIDの配列
   * @param version - バージョン番号
   * @param from - この時点（`createdAt`基準）より後の記録に限定する
   * @param to - この時点（`createdAt`基準）以前の記録に限定する
   * @returns userId→記録一覧のMap
   */
  async getTotalBpiLogsInRangeForUsers(
    userIds: string[],
    version: string,
    from: Date,
    to: Date,
  ): Promise<Map<string, { createdAt: Date; totalBpi: number }[]>> {
    if (userIds.length === 0) return new Map();
    const rows = await db
      .selectFrom("userStatusLogs")
      .select(["userId", "createdAt", "totalBpi"])
      .where("userId", "in", userIds)
      .where("version", "=", version)
      .where("createdAt", ">", from)
      .where("createdAt", "<=", to)
      .orderBy("id", "asc")
      .execute();
    const result = new Map<string, { createdAt: Date; totalBpi: number }[]>();
    for (const r of rows) {
      const arr = result.get(r.userId) ?? [];
      arr.push({ createdAt: r.createdAt, totalBpi: Number(r.totalBpi) });
      result.set(r.userId, arr);
    }
    return result;
  }

  /**
   * 指定バージョンにおける各ユーザーの最新 `userStatusLogs` 行の ID を取得するサブクエリを組み立てる。
   *
   * @param version - バージョン番号
   */
  latestPerUserSubquery(version: string) {
    return db
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");
  }

  /**
   * 指定ユーザーの全バージョンのBPI履歴（バージョンごとの最新1件）を取得する。
   *
   * @param userId - ユーザー ID
   */
  async getBpiHistoryByVersion(userId: string) {
    return await db
      .selectFrom("userStatusLogs as usl")
      .innerJoin(
        (eb) =>
          eb
            .selectFrom("userStatusLogs")
            .select(["version", (sub) => sub.fn.max("id").as("maxId")])
            .where("userId", "=", userId)
            .groupBy("version")
            .as("latest"),
        (join) => join.onRef("usl.id", "=", "latest.maxId"),
      )
      .select(["usl.version", "usl.totalBpi"])
      .execute();
  }

  /**
   * 指定ユーザー・バージョンの最新1件をJOIN用サブクエリとして組み立てる。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  latestRowSubquery(userId: string, version: string) {
    return db
      .selectFrom("userStatusLogs")
      .select(["userId", "totalBpi", "arenaRank", "id"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1);
  }

  /**
   * 手動スコア編集用に、その日の総合BPI・アリーナランクスナップショットを
   * upsertする。`navigationRepo.upsertManualBatch`と同じ「現在の最新行が
   * 同じbatchIdの場合のみUPDATE、それ以外はINSERT」方針。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params - upsertする内容（`batchId`は手動編集用の決定的ID）
   */
  async upsertManualBatch(
    trx: Transaction<Database>,
    params: {
      userId: string;
      version: string;
      batchId: string;
      totalBpi: number;
      arenaRank: string | null;
    },
  ) {
    const latest = await trx
      .selectFrom("userStatusLogs")
      .select(["id", "batchId"])
      .where("userId", "=", params.userId)
      .where("version", "=", params.version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();

    if (latest && latest.batchId === params.batchId) {
      await trx
        .updateTable("userStatusLogs")
        .set({
          totalBpi: params.totalBpi.toFixed(2),
          arenaRank: params.arenaRank,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .where("id", "=", latest.id)
        .execute();
      return;
    }

    await trx
      .insertInto("userStatusLogs")
      .values({
        userId: params.userId,
        totalBpi: params.totalBpi,
        arenaRank: params.arenaRank,
        version: params.version,
        batchId: params.batchId,
      })
      .execute();
  }

  /**
   * ステータスログを1件以上挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(
    trx: Transaction<Database>,
    values: NewUserStatusLog | NewUserStatusLog[],
  ) {
    await trx.insertInto("userStatusLogs").values(values).execute();
  }

  /**
   * 指定ユーザーの全ステータスログを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("userStatusLogs")
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * バックアップ用にユーザーの全ステータスログを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("userStatusLogs")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * 指定バッチに紐づくステータスログを削除する。
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
      .deleteFrom("userStatusLogs")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }
}

export const userStatusLogsRepo = new UserStatusLogsRepository();
