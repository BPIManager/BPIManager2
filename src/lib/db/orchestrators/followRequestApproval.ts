import { db } from "@/lib/db";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";

/**
 * フォローリクエストを承認する。
 *
 * `followRequests`行の削除・`follows`行の作成・承認通知の記録を
 * 1トランザクションで行う。トランザクション開始前に確認した行が、
 * 実行時には既に却下/取り下げ等で消費済みになっている競合状態があり
 * 得るため、削除が実際に行われたか（`deleteById`の返り値）を確認して
 * からのみ後続の`follows`作成・通知記録を行う。
 *
 * @param requestId - フォローリクエストID
 * @param targetUserId - 承認操作を行うユーザー ID（リクエスト先本人であることの確認に使う）
 * @returns 承認したリクエストの送信者ID。リクエストが存在しない、
 *   `targetUserId`がリクエスト先と一致しない、または承認直前に他の操作で
 *   消費済みだった場合は`null`
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
