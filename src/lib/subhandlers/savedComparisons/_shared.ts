import type { NextApiRequest } from "next";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";
import type { AnalyticsTarget } from "@/types/analytics";
import { usersRepo } from "@/lib/db/domains/users";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { canViewUserData } from "@/lib/db/shared/visibility";

/** savedComparisons ドメインの subhandler 共通型・ヘルパー。全ルートが withAuth 配下のため認証済みの本人が保証される */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}

export type SavedTargetView = AnalyticsTarget & { accessible: boolean };

/** 他ユーザーのデータを参照する比較ターゲット（現状 `rival` のみ param がユーザーID）か */
const refersToOtherUser = (t: AnalyticsTarget, ownerId: string) =>
  t.kind === "rival" && !!t.param && t.param !== ownerId;

/**
 * 参照先ユーザーが非公開かつ承認済みフォローが無いターゲットを「閲覧不可」にし、相手名を含み得る label を返さない。
 * 保存データ自体は変更しない（承認されれば再び閲覧可能になる）。
 *
 * @param canView - 閲覧者が対象ユーザーのデータを見られるかの判定
 */
export async function maskInaccessibleTargets(
  ownerId: string,
  targets: AnalyticsTarget[],
  canView: (targetUserId: string) => Promise<boolean>,
): Promise<SavedTargetView[]> {
  return await Promise.all(
    targets.map(async (t) => {
      if (!refersToOtherUser(t, ownerId)) return { ...t, accessible: true };
      if (await canView(t.param!)) return { ...t, accessible: true };
      return { kind: t.kind, param: t.param, version: t.version, label: "", accessible: false };
    }),
  );
}

/** 閲覧者（本人）が対象ユーザーのデータを閲覧できるか。他機能と同じ公開設定＋承認済みフォローの条件で判定する */
export async function canViewerSeeUser(
  viewerId: string,
  targetUserId: string,
): Promise<boolean> {
  const info = await usersRepo.getAccessInfo(targetUserId);
  if (!info) return false;
  const hasFollowAccess =
    !info.isPublic &&
    (await followAccessAggregateRepo.hasApprovedFollowAccess(viewerId, targetUserId));
  return canViewUserData({
    viewerId,
    targetUserId,
    isPublic: info.isPublic,
    hasFollowAccess,
  });
}

export function parseStoredTargets(json: string): AnalyticsTarget[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as AnalyticsTarget[]) : [];
  } catch {
    return [];
  }
}
