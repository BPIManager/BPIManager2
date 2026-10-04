import type { Transaction } from "kysely";
import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import type { Database } from "@/types/db";

/**
 * ユーザーの書き込みロックを取った1トランザクション内で処理を実行する。
 * 並行する保存（手動・MCP・インポート）の結果を基準に読めるよう、読み取りも `trx` で行うこと。
 *
 * @param userId - ロック対象のユーザー ID
 * @param work - ロック取得後に実行する処理。渡される `trx` に参加させる
 */
export async function withUserWriteLock<T>(
  userId: string,
  work: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
  return await db.transaction().execute(async (trx) => {
    await lockUserForWrite(trx, userId);
    return await work(trx);
  });
}
