import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * アカウント削除前に全ユーザーデータをJSONとしてバックアップし、
 * FK制約を考慮した順序で物理削除を行う。
 */
export async function backupAndDeleteUser(userId: string): Promise<void> {
  const [
    user,
    follows,
    scores,
    logs,
    radarCache,
    notifications,
    statusLogs,
    roles,
    apiKeys,
    allScores,
    discordLinks,
  ] = await Promise.all([
    db.selectFrom("users").selectAll().where("userId", "=", userId).execute(),
    db
      .selectFrom("follows")
      .selectAll()
      .where((eb) =>
        eb.or([eb("followerId", "=", userId), eb("followingId", "=", userId)]),
      )
      .execute(),
    db.selectFrom("scores").selectAll().where("userId", "=", userId).execute(),
    db.selectFrom("logs").selectAll().where("userId", "=", userId).execute(),
    db
      .selectFrom("userRadarCache")
      .selectAll()
      .where("userId", "=", userId)
      .execute(),
    db
      .selectFrom("notifications")
      .selectAll()
      .where("userId", "=", userId)
      .execute(),
    db
      .selectFrom("userStatusLogs")
      .selectAll()
      .where("userId", "=", userId)
      .execute(),
    db
      .selectFrom("userRoles")
      .selectAll()
      .where("userId", "=", userId)
      .execute(),
    db.selectFrom("apiKeys").selectAll().where("userId", "=", userId).execute(),
    db
      .selectFrom("allScores")
      .selectAll()
      .where("userId", "=", userId)
      .execute(),
    db
      .selectFrom("discordLinks")
      .selectAll()
      .where("userId", "=", userId)
      .execute(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    userId,
    user,
    follows,
    scores,
    logs,
    radarCache,
    notifications,
    statusLogs,
    roles,
    apiKeys,
    allScores,
    discordLinks,
  };

  // 2. バックアップをファイルに書き出す
  const backupDir = path.join(os.homedir(), "backups", "delete");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${userId}_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");

  // 3. FK制約を考慮した順序で物理削除（トランザクション）
  await db.transaction().execute(async (trx) => {
    // allScores: FK to logs(SET NULL), users(CASCADE)
    await trx.deleteFrom("allScores").where("userId", "=", userId).execute();

    // scores: FK to logs(SET NULL), users(CASCADE)
    await trx.deleteFrom("scores").where("userId", "=", userId).execute();

    // logs: FK to users(CASCADE)
    await trx.deleteFrom("logs").where("userId", "=", userId).execute();

    // follows: FK to users(CASCADE) for both sides
    await trx
      .deleteFrom("follows")
      .where((eb) =>
        eb.or([eb("followerId", "=", userId), eb("followingId", "=", userId)]),
      )
      .execute();

    // apiKeys: FK to users(CASCADE)
    await trx.deleteFrom("apiKeys").where("userId", "=", userId).execute();

    // notifications: FK to users(CASCADE)
    await trx
      .deleteFrom("notifications")
      .where("userId", "=", userId)
      .execute();

    // userRadarCache: FK to users(CASCADE)
    await trx
      .deleteFrom("userRadarCache")
      .where("userId", "=", userId)
      .execute();

    // userRoles: FK to users(CASCADE)
    await trx.deleteFrom("userRoles").where("userId", "=", userId).execute();

    // userStatusLogs: FK to users(CASCADE)
    await trx
      .deleteFrom("userStatusLogs")
      .where("userId", "=", userId)
      .execute();

    // discordLinks: FK to users(CASCADE)
    await trx.deleteFrom("discordLinks").where("userId", "=", userId).execute();

    // users: メインレコード
    await trx.deleteFrom("users").where("userId", "=", userId).execute();
  });
}
