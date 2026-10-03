import type { Transaction } from "kysely";
import type { Database } from "@/types/db";

/**
 * ユーザー単位の書き込みを直列化する行ロック。
 *
 * スコア・ログ・アカウント削除など、同一ユーザーのデータを読んでから書く処理は、
 * 読み取りより前にこのロックを取得する。先行トランザクションのコミットを待ってから読むため、
 * 古い値を基準にした差分計算や、削除中の書き込み取りこぼしを防ぐ。
 * `users` 行は全ユーザーで一意なので、ユーザーごとのミューテックスとして使える。
 */
export async function lockUserForWrite(
  trx: Transaction<Database>,
  userId: string,
): Promise<void> {
  await trx
    .selectFrom("users")
    .select("userId")
    .where("userId", "=", userId)
    .forUpdate()
    .executeTakeFirst();
}
