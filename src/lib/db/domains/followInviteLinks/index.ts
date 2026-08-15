import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";
import { randomUUID } from "crypto";

/**
 * 非公開ユーザーのフォローリクエスト受付用招待URL（`followInviteLinks`
 * テーブル）の読み書きを担当するリポジトリクラス。
 *
 * ユーザーごとに常に1件のみ有効なトークンを持つ（1:1）。再発行は
 * 既存行の`token`を上書きするだけでよく、旧トークンは自動的に無効化される。
 */
class FollowInviteLinksRepository {
  /**
   * ユーザーの現在の招待トークンを取得する。未発行の場合は`undefined`。
   *
   * @param userId - ユーザー ID
   */
  async getByUserId(userId: string) {
    return await db
      .selectFrom("followInviteLinks")
      .selectAll()
      .where("userId", "=", userId)
      .executeTakeFirst();
  }

  /**
   * トークンから招待発行元のユーザーIDを取得する。
   *
   * @param token - 招待トークン
   */
  async getByToken(token: string) {
    return await db
      .selectFrom("followInviteLinks")
      .selectAll()
      .where("token", "=", token)
      .executeTakeFirst();
  }

  /**
   * 招待トークンを新規発行、または既存トークンを再発行（無効化して差し替え）する。
   *
   * @param userId - ユーザー ID
   * @returns 発行された新しいトークン
   */
  async regenerate(userId: string): Promise<string> {
    const token = randomUUID().replace(/-/g, "");

    await db
      .insertInto("followInviteLinks")
      .values({ userId, token })
      .onDuplicateKeyUpdate({ token, createdAt: new Date() })
      .execute();

    return token;
  }

  /**
   * ユーザーの招待リンクレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("followInviteLinks")
      .where("userId", "=", userId)
      .execute();
  }
}

export const followInviteLinksRepo = new FollowInviteLinksRepository();
