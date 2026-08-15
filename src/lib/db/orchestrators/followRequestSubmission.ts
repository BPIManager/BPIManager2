import { usersRepo } from "@/lib/db/domains/users";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";

export type SubmitFollowRequestResult =
  | { status: "requested" }
  | { status: "followed" }
  | { status: "invalid_token" }
  | { status: "self" }
  | { status: "target_not_found" };

/**
 * 招待URLのトークンからフォローリクエストを送信する。
 *
 * 対象ユーザーが（招待発行後に）公開設定に変わっていた場合は、承認を待たず
 * 通常のフォローと同様に即時`follows`を作成する（招待URLが古くなっていても
 * 迷子の保留リクエストを残さないため）。
 *
 * @param requesterId - リクエストを送るユーザー ID
 * @param token - 招待URLのトークン
 */
export async function submitFollowRequest(
  requesterId: string,
  token: string,
): Promise<SubmitFollowRequestResult> {
  const invite = await followInviteLinksRepo.getByToken(token);
  if (!invite) return { status: "invalid_token" };

  const targetUserId = invite.userId;
  if (targetUserId === requesterId) return { status: "self" };

  const target = await usersRepo.getAccessInfo(targetUserId);
  if (!target) return { status: "target_not_found" };

  if (target.isPublic) {
    const isAlreadyFollowing = await followsRepo.isFollowing(
      requesterId,
      targetUserId,
    );
    if (!isAlreadyFollowing) {
      await followsRepo.toggleFollow(requesterId, targetUserId);
    }
    return { status: "followed" };
  }

  // 対象が非公開の場合、follows行の有無だけでなく承認記録も確認する。
  // 承認制導入前(公開時代)に成立した未承認のfollowsは「既にフォロー済み」
  // として扱わない(招待URL再送信をきっかけに正規のリクエストとして
  // 再送信できるようにする。承認されればlegacyの仮想エントリも自動解消する)
  const hasApprovedAccess = await followAccessAggregateRepo.hasApprovedFollowAccess(
    requesterId,
    targetUserId,
  );
  if (hasApprovedAccess) return { status: "followed" };

  await followRequestsRepo.create(requesterId, targetUserId);
  return { status: "requested" };
}
