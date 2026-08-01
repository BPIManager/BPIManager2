import { db } from "@/lib/db";
import { sql, Expression, Transaction } from "kysely";
import { Database } from "@/types/db";

/**
 * `users` テーブル自体の参照・作成・更新を担当するリポジトリクラス。
 *
 * 他ドメインを横断してユーザー向けの複合ビューを組み立てる処理
 * （おすすめユーザー一覧・検索・ランキング・プロフィール取得等）は
 * `db/aggregates/userProfiles/` に切り出している。
 */
class UsersRepository {
  /**
   * 指定ユーザー名が既に使用されているか確認する。
   *
   * @param userName - チェックするユーザー名
   * @returns 同名ユーザーのレコード（存在しない場合は `undefined`）
   */
  async checkUserNameAvailability(userName: string) {
    return await db
      .selectFrom("users")
      .select("userId")
      .where("userName", "=", userName)
      .executeTakeFirst();
  }

  /**
   * ユーザープロフィールを作成または更新する（UPSERT）。
   *
   * ユーザー名の重複チェックを行った上で `users` テーブルを UPSERT する。
   * `userStatusLogs` への追加書き込みを含む複数ドメインへのトランザクション
   * 制御は呼び出し元（`orchestrators/userProfileUpsert`）の責務とする。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params.userId - ユーザー ID
   * @param params.userName - ユーザー名（他ユーザーと重複不可）
   * @param params.iidxId - IIDX プレイヤー ID
   * @param params.profileText - プロフィールテキスト
   * @param params.profileImage - プロフィール画像 URL
   * @param params.isPublic - 公開設定（`1`: 公開、`0`: 非公開）
   * @throws ユーザー名が重複する場合は `status: 409` を持つエラー
   */
  async upsertUserProfile(
    trx: Transaction<Database>,
    params: {
      userId: string;
      userName: string;
      iidxId: string | null;
      profileText: string | null;
      profileImage: string | null;
      isPublic: number;
      xId: string | null;
    },
  ) {
    const { userId, userName, iidxId, profileText, profileImage, isPublic, xId } =
      params;

    const existingUser = await trx
      .selectFrom("users")
      .select("userId")
      .where("userName", "=", userName)
      .where("userId", "!=", userId)
      .executeTakeFirst();

    if (existingUser) {
      const error = new Error("UserName is already taken");
      Object.assign(error, { status: 409 });
      throw error;
    }

    await trx
      .insertInto("users")
      .values({
        userId,
        userName,
        iidxId,
        profileText,
        profileImage,
        isPublic,
        xId,
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        userName,
        iidxId,
        profileText,
        profileImage,
        isPublic,
        xId,
        updatedAt: new Date(),
      })
      .execute();
  }

  /**
   * 登録ユーザー数を取得する。`onJstDate` 指定時はその日(JST)に登録したユーザー数に絞り込む。
   *
   * @param onJstDate - `DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))` と比較するSQL式
   */
  async getCount(onJstDate?: Expression<unknown>): Promise<number> {
    let query = db
      .selectFrom("users")
      .select((eb) => eb.fn.count("userId").as("count"));
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
   * ユーザー名を取得する（アカウント削除時の確認用）。
   *
   * @param userId - ユーザー ID
   * @returns ユーザー名、存在しない場合は `null`
   */
  async getUserName(userId: string): Promise<string | null> {
    const user = await db
      .selectFrom("users")
      .select("userName")
      .where("userId", "=", userId)
      .executeTakeFirst();
    return user?.userName ?? null;
  }

  /**
   * IIDX ID を取得する（地域ランキング表示用）。
   *
   * @param userId - ユーザー ID
   * @returns `{ iidxId }`（`iidxId`は未設定の場合`null`）、ユーザー自体が存在しない場合は `undefined`
   */
  async getIidxId(userId: string) {
    return await db
      .selectFrom("users")
      .select("iidxId")
      .where("userId", "=", userId)
      .executeTakeFirst();
  }

  /**
   * バックアップ用にユーザーレコードを取得する（`userId` は一意のため0または1件）。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("users")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ユーザーのメインレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("users").where("userId", "=", userId).execute();
  }

  /**
   * 全ユーザーIDの一覧を取得する（sitemap生成・cronバッチ処理用）。
   */
  async getAllUserIds() {
    return await db.selectFrom("users").select("userId").execute();
  }

  /**
   * `iidxId` が設定済みの全ユーザーの `userId`・`iidxId` を取得する
   * （公式アリーナランキングとの照合用）。
   */
  async getUsersWithIidxId() {
    return await db
      .selectFrom("users")
      .select(["userId", "iidxId"])
      .where("iidxId", "is not", null)
      .execute();
  }
}

export const usersRepo = new UsersRepository();
