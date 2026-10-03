import { db } from "@/lib/db";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * フォローリクエストを承認し、リクエスト削除・follows作成・承認通知記録を1トランザクションで行う。
 * 確認後に既に消費済みの競合があり得るため、削除が実際に行われた場合のみ後続処理を行う。
 *
 * @param requestId - フォローリクエストID
 * @param targetUserId - 承認操作を行うユーザー ID（リクエスト先本人の確認に使う）
 * @returns 承認したリクエストの送信者ID。存在しない・不一致・既に消費済みの場合は null
 */
export async function approveFollowRequest(
  requestId: number,
  targetUserId: string,
): Promise<string | null> {
  const request = await followRequestsRepo.getById(requestId);
  if (!request || request.targetUserId !== targetUserId) return null;

  const approved = await db.transaction().execute(async (trx) => {
    const deleted = await followRequestsRepo.deleteById(trx, requestId);
    if (!deleted) return false;

    await followsRepo.create(trx, request.requesterId, targetUserId);
    await followApprovalNotificationsRepo.create(trx, {
      recipientId: request.requesterId,
      actorId: targetUserId,
    });
    return true;
  });

  return approved ? request.requesterId : null;
}
