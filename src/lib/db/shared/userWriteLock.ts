import type { Transaction } from "kysely";
import type { Database } from "@/types/db";

/**
 * ユーザー単位の書き込みを直列化する行ロック。読んでから書く処理は、読み取りより前にこのロックを取得する。
 * 先行トランザクションのコミットを待つことで、古い値を基準にした差分計算や削除中の書き込み取りこぼしを防ぐ。
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
