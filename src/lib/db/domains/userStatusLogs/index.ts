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
    await trx.deleteFrom("userStatusLogs").where("userId", "=", userId).execute();
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
