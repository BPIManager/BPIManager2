import { db } from "@/lib/db";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { followsRepo } from "@/lib/db/domains/follow";
import { apiKeysRepo } from "@/lib/db/domains/apiKeys";
import { notificationsRepo } from "@/lib/db/domains/notifications";
import { radarCacheRepo } from "@/lib/db/domains/radar";
import { discordLinksRepo } from "@/lib/db/domains/discord";
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

  // apiKeys.key は秘密情報のため、バックアップには残さずレコードの存在のみ記録する
  const redactedApiKeys = apiKeys.map(({ key: _key, ...rest }) => rest);

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
    apiKeys: redactedApiKeys,
    allScores,
    discordLinks,
  };

  // 2. バックアップをファイルに書き出す
  const backupDir = path.join(os.homedir(), "backups", "delete");
  await fs.promises.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${userId}_${Date.now()}.json`);
  await fs.promises.writeFile(
    backupPath,
    JSON.stringify(backup, null, 2),
    "utf-8",
  );

  // 3. FK制約を考慮した順序で物理削除(トランザクション)。
  // このオーケストレーターは各ドメインリポジトリのdeleteByUserメソッドを
  // 呼び出す役に徹し、他ドメインが所有するテーブルへ直接クエリを発行しない。
  await db.transaction().execute(async (trx) => {
    // allScores: FK to logs(SET NULL), users(CASCADE)
    await allScoresRepo.deleteByUser(trx, userId);

    // scores: FK to logs(SET NULL), users(CASCADE)
    await scoresRepo.deleteByUser(trx, userId);

    // logs: FK to users(CASCADE)
    await navigationRepo.deleteByUser(trx, userId);

    // follows: FK to users(CASCADE) for both sides
    await followsRepo.deleteByUser(trx, userId);

    // apiKeys: FK to users(CASCADE)
    await apiKeysRepo.deleteByUser(trx, userId);

    // notifications: FK to users(CASCADE)
    await notificationsRepo.deleteByUser(trx, userId);

    // userRadarCache: FK to users(CASCADE)
    await radarCacheRepo.deleteByUser(trx, userId);

    // userRoles: FK to users(CASCADE)
    await discordLinksRepo.deleteRoleByUser(trx, userId);

    // userStatusLogs: FK to users(CASCADE)
    await userStatusLogsRepo.deleteByUser(trx, userId);

    // discordLinks: FK to users(CASCADE)
    await discordLinksRepo.deleteLinkByUser(trx, userId);

    // users: メインレコード
    await trx.deleteFrom("users").where("userId", "=", userId).execute();
  });
}
