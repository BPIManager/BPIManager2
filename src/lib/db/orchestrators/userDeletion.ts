import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { usersRepo } from "@/lib/db/domains/users";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";
import { scoreHistoryRepo } from "@/lib/db/domains/scores/history";
import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { logBatchRepo } from "@/lib/db/domains/logs/batch";
import { followsRepo } from "@/lib/db/domains/follow";
import { apiKeysRepo } from "@/lib/db/domains/apiKeys";
import { notificationsRepo } from "@/lib/db/domains/notifications";
import { radarCacheRepo } from "@/lib/db/domains/radar";
import { discordLinksRepo } from "@/lib/db/domains/discord";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * アカウント削除前に全ユーザーデータをJSONとしてバックアップし、
 * FK制約を考慮した順序で物理削除を行う。
 */
export async function backupAndDeleteUser(userId: string): Promise<void> {
  // バックアップ読み取り・書き出し・物理削除を、書き込みロックを取った1トランザクションで行う。書き出し失敗時は削除もロールバックされる。
  await db.transaction().execute(async (trx) => {
  await lockUserForWrite(trx, userId);
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
    followRequests,
    followInviteLinks,
    followApprovalNotifications,
    followLists,
  ] = await Promise.all([
    usersRepo.getAllForUser(userId),
    followsRepo.getAllForUser(userId),
    scoreHistoryRepo.getAllForUser(userId),
    logBatchRepo.getAllForUser(userId),
    radarCacheRepo.getAllForUser(userId),
    notificationsRepo.getAllForUser(userId),
    userStatusLogsReadRepo.getAllForUser(userId),
    discordLinksRepo.getRolesForUser(userId),
    apiKeysRepo.getAllForUser(userId),
    allScoresRepo.getAllForUser(userId),
    discordLinksRepo.getLinksForUser(userId),
    followRequestsRepo.getAllForUser(userId),
    followInviteLinksRepo.getByUserId(userId),
    followApprovalNotificationsRepo.getAllForUser(userId),
    followListsRepo.getAllForUser(userId),
  ]);

  // followListsの取得結果(id)に依存するため、上のPromise.allとは別に取得する
  const followListMembers = await followListMembersRepo.getAllForLists(
    followLists.map((l) => l.id),
  );

  // apiKeys.key / followInviteLinks.token は秘密情報のため、バックアップには
  // 残さずレコードの存在のみ記録する
  const redactedApiKeys = apiKeys.map(({ key: _key, ...rest }) => rest);
  const redactedFollowInviteLinks = followInviteLinks
    ? (({ token: _token, ...rest }) => rest)(followInviteLinks)
    : followInviteLinks;

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
    followRequests,
    followInviteLinks: redactedFollowInviteLinks,
    followApprovalNotifications,
    followLists,
    followListMembers,
  };

  // バックアップをファイルへ書き出す。コンテナ等で os.homedir() 配下が非永続の場合があるため、USER_DELETION_BACKUP_DIR で保存先を指定できる。
  const backupDir =
    process.env.USER_DELETION_BACKUP_DIR ??
    path.join(os.homedir(), "backups", "delete");
  await fs.promises.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${userId}_${Date.now()}.json`);
  await fs.promises.writeFile(
    backupPath,
    JSON.stringify(backup, null, 2),
    "utf-8",
  );

  // FK 順で物理削除する（トランザクション）。他ドメインのテーブルへ直接クエリを発行せず、各リポジトリの deleteByUser に委譲する（users 自身を除く）。
  {
    // allScores: FK to logs(SET NULL), users(CASCADE)
    await allScoresRepo.deleteByUser(trx, userId);

    // scores: FK to logs(SET NULL), users(CASCADE)
    await scoreWriteRepo.deleteByUser(trx, userId);

    // logs: FK to users(CASCADE)
    await logBatchRepo.deleteByUser(trx, userId);

    // follows: FK to users(CASCADE) for both sides
    await followsRepo.deleteByUser(trx, userId);

    // followListMembers(followingId側): 他人のリストに追加されている分。
    // listId側(自分のリスト所有分)はfollowListsの削除でCASCADEされる
    await followListMembersRepo.deleteByFollowing(trx, userId);

    // followLists: FK to users(CASCADE)。所属メンバー(followListMembers)は
    // listIdのON DELETE CASCADEで連動削除される
    await followListsRepo.deleteByUser(trx, userId);

    // apiKeys: FK to users(CASCADE)
    await apiKeysRepo.deleteByUser(trx, userId);

    // notifications: FK to users(CASCADE)
    await notificationsRepo.deleteByUser(trx, userId);

    // userRadarCache: FK to users(CASCADE)
    await radarCacheRepo.deleteByUser(trx, userId);

    // userRoles: FK to users(CASCADE)
    await discordLinksRepo.deleteRoleByUser(trx, userId);

    // userStatusLogs: FK to users(CASCADE)
    await userStatusLogsWriteRepo.deleteByUser(trx, userId);

    // discordLinks: FK to users(CASCADE)
    await discordLinksRepo.deleteLinkByUser(trx, userId);

    // followRequests: FK to users(CASCADE) for both requesterId/targetUserId
    await followRequestsRepo.deleteByUser(trx, userId);

    // followInviteLinks: FK to users(CASCADE)
    await followInviteLinksRepo.deleteByUser(trx, userId);

    // followApprovalNotifications: FK to users(CASCADE) for both recipientId/actorId
    await followApprovalNotificationsRepo.deleteByUser(trx, userId);

    // users: メインレコード
    await usersRepo.deleteByUser(trx, userId);
  }
  });
}
