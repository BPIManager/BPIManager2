import { db } from "@/lib/db";
import { sql, Expression } from "kysely";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";

/**
 * `users` テーブル自体の参照・作成・更新を担当するリポジトリクラス。
 *
 * 他ドメインを横断してユーザー向けの複合ビューを組み立てる処理
 * （おすすめユーザー一覧・検索・ランキング・プロフィール取得等）は
 * `db/aggregates/userProfiles/` に切り出している（#160）。
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
   * トランザクション内でユーザー名の重複チェックを行い、
   * `users` テーブルを UPSERT した後に `userStatusLogs` にもレコードを追加する。
   *
   * @param params.userId - ユーザー ID
   * @param params.userName - ユーザー名（他ユーザーと重複不可）
   * @param params.iidxId - IIDX プレイヤー ID
   * @param params.profileText - プロフィールテキスト
   * @param params.profileImage - プロフィール画像 URL
   * @param params.isPublic - 公開設定（`1`: 公開、`0`: 非公開）
   * @param params.arenaRank - アリーナランク
   * @param params.version - バージョン番号
   * @param params.batchId - バッチ ID
   * @returns `{ success: true }`
   * @throws ユーザー名が重複する場合は `status: 409` を持つエラー
   */
  async upsertUserProfile(params: {
    userId: string;
    userName: string;
    iidxId: string | null;
    profileText: string | null;
    profileImage: string | null;
    isPublic: number;
    xId: string | null;
    version: string;
    batchId: string;
  }) {
    const {
      userId,
      userName,
      iidxId,
      profileText,
      profileImage,
      isPublic,
      xId,
      version,
      batchId,
    } = params;

    return await db.transaction().execute(async (trx) => {
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

      const lastStatus = await userStatusLogsRepo.getLatestTotalBpi(
        trx,
        userId,
        version,
      );

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

      await userStatusLogsRepo.insert(trx, {
        userId,
        totalBpi: lastStatus?.totalBpi ?? -15,
        version,
        batchId,
      });

      return { success: true };
    });
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
}

export const usersRepo = new UsersRepository();
