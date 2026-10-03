import { db } from "@/lib/db";
import { usersRepo } from "@/lib/db/domains/users";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";

/**
 * ユーザープロフィールを作成・更新し、userStatusLogs に新規ログを追加する。users と userStatusLogs の書き込みを1トランザクションで束ねる。
 *
 * @param params.userId - ユーザー ID
 * @param params.userName - ユーザー名（他ユーザーと重複不可）
 * @param params.iidxId - IIDX プレイヤー ID
 * @param params.profileText - プロフィールテキスト
 * @param params.profileImage - プロフィール画像 URL
 * @param params.isPublic - 公開設定（1: 公開、0: 非公開）
 * @param params.version - バージョン番号
 * @param params.batchId - バッチ ID
 * @returns { success: true }
 * @throws ユーザー名が重複する場合は status: 409 を持つエラー
 */
export async function upsertUserProfile(params: {
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
  const { userId, version, batchId, ...profileFields } = params;

  return await db.transaction().execute(async (trx) => {
    const lastStatus = await userStatusLogsReadRepo.getLatestTotalBpi(
      trx,
      userId,
      version,
    );

    await usersRepo.upsertUserProfile(trx, { userId, ...profileFields });

    await userStatusLogsWriteRepo.insert(trx, {
      userId,
      totalBpi: lastStatus?.totalBpi ?? -15,
      version,
      batchId,
    });

    return { success: true };
  });
}
