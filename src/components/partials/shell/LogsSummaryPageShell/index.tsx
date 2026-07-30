import { ReactNode } from "react";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useIsOwnProfile } from "@/hooks/users/useIsOwnProfile";

interface LogsSummaryRenderCtx {
  userId: string;
  version: string;
  query: ParsedUrlQuery;
}

interface LogsSummaryPageShellProps {
  /** 閲覧者が本人の場合に描画する内容(DashboardLayout等のラップも呼び出し側が行う) */
  ownProfile: (ctx: LogsSummaryRenderCtx) => ReactNode;
  /** 閲覧者が本人以外の場合に描画する内容 */
  publicProfile: (ctx: LogsSummaryRenderCtx) => ReactNode;
}

/**
 * `users/[userId]/logs/[version]/summary/**` および `[batchId]` ページで共通の
 * 「router準備待ち → 本人/他人の判定」までをまとめたシェル。
 * 本人/他人それぞれで実際に描画する内容はrender propとして呼び出し側が持つ。
 */
export const LogsSummaryPageShell = ({
  ownProfile,
  publicProfile,
}: LogsSummaryPageShellProps) => {
  const { isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version } = router.query;
  const isOwnProfile = useIsOwnProfile(userId);
  const isInitialLoading = !router.isReady || isUserLoading;

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const ctx: LogsSummaryRenderCtx = {
    userId: userId as string,
    version: version as string,
    query: router.query,
  };

  return isOwnProfile ? ownProfile(ctx) : publicProfile(ctx);
};
