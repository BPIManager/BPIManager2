import { db } from "@/lib/db";
import { usersRepo } from "@/lib/db/domains/users";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";

/**
 * ユーザープロフィールを作成または更新し、`userStatusLogs` に新規ログを追加する。
 *
 * `users`・`userStatusLogs` の2ドメインにまたがる書き込みをトランザクションで
 * 束ねるオーケストレーター。各ドメインへの実際の書き込みは
 * `usersRepo`/`userStatusLogsRepo` に委譲する。
 *
 * @param params.userId - ユーザー ID
 * @param params.userName - ユーザー名（他ユーザーと重複不可）
 * @param params.iidxId - IIDX プレイヤー ID
 * @param params.profileText - プロフィールテキスト
 * @param params.profileImage - プロフィール画像 URL
 * @param params.isPublic - 公開設定（`1`: 公開、`0`: 非公開）
 * @param params.version - バージョン番号
 * @param params.batchId - バッチ ID
 * @returns `{ success: true }`
 * @throws ユーザー名が重複する場合は `status: 409` を持つエラー
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
    const lastStatus = await userStatusLogsRepo.getLatestTotalBpi(
      trx,
      userId,
      version,
    );

    await usersRepo.upsertUserProfile(trx, { userId, ...profileFields });

    await userStatusLogsRepo.insert(trx, {
      userId,
      totalBpi: lastStatus?.totalBpi ?? -15,
      version,
      batchId,
    });

    return { success: true };
  });
}
