import { db } from "@/lib/db";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * フォローリクエストを承認する。
 *
 * `followRequests`行の削除・`follows`行の作成・承認通知の記録を
 * 1トランザクションで行う。
 *
 * @param requestId - フォローリクエストID
 * @param targetUserId - 承認操作を行うユーザー ID（リクエスト先本人であることの確認に使う）
 * @returns 承認したリクエストの送信者ID。リクエストが存在しない、または
 *   `targetUserId`がリクエスト先と一致しない場合は`null`
 */
export async function approveFollowRequest(
  requestId: number,
  targetUserId: string,
): Promise<string | null> {
  const request = await followRequestsRepo.getById(requestId);
  if (!request || request.targetUserId !== targetUserId) return null;

  await db.transaction().execute(async (trx) => {
    await followRequestsRepo.deleteById(trx, requestId);
    await followsRepo.create(trx, request.requesterId, targetUserId);
    await followApprovalNotificationsRepo.create(trx, {
      recipientId: request.requesterId,
      actorId: targetUserId,
    });
  });

  return request.requesterId;
}
