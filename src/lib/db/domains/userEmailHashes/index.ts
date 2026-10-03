import { db } from "@/lib/db";
import type { Transaction } from "kysely";
import type { Database } from "@/types/db";

/**
 * メールアドレスのハッシュ（HMAC、平文は保存しない）の参照・更新。
 * 1ユーザーにつきメールアドレスは最大1件（Firebase Auth の password プロバイダと対応）。
 */
class UserEmailHashesRepository {
  /**
   * 指定ハッシュを保持しているユーザーの userId を返す。
   *
   * @param emailHash - `hashEmail` で得たハッシュ
   * @returns userId、未使用の場合は `undefined`
   */
  async findUserIdByHash(emailHash: string) {
    return await db
      .selectFrom("userEmailHashes")
      .select("userId")
      .where("emailHash", "=", emailHash)
      .executeTakeFirst();
  }

  /**
   * ユーザーのメールハッシュを登録・更新する。別ユーザーとの重複チェックは呼び出し側で行うこと。
   *
   * @param userId - ユーザー ID
   * @param emailHash - `hashEmail` で得たハッシュ
   */
  async upsert(userId: string, emailHash: string) {
    await db
      .insertInto("userEmailHashes")
      .values({ userId, emailHash })
      .onDuplicateKeyUpdate({ emailHash })
      .execute();
  }

  /**
   * ユーザーのメールハッシュを削除する（メールアドレスの連携解除時）。
   *
   * @param userId - ユーザー ID
   * @param trx - 呼び出し元のトランザクション（省略時は単独実行）
   */
  async deleteByUserId(userId: string, trx?: Transaction<Database>) {
    await (trx ?? db)
      .deleteFrom("userEmailHashes")
      .where("userId", "=", userId)
      .execute();
  }
}

export const userEmailHashesRepo = new UserEmailHashesRepository();
