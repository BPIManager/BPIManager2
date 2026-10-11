"use client";

import { useRouter } from "next/router";
import UserProfileLayout from "@/components/partials/common/Profile/Layout/layout";
import { useFollowList } from "@/hooks/users/useFollowList";
import UserFollowCard from "./ui";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { LoadingSpinner, SectionLoader } from "@/components/ui/loading-spinner";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import ViewPermissionsModal from "@/components/partials/modal/ViewPermissions";
import { useUser } from "@/contexts/users/UserContext";
import { useFollowRequests } from "@/hooks/users/useFollowRequests";
import { useViewPermissions } from "@/hooks/users/useViewPermissions";
import { useState } from "react";

export default function FollowPage({
  type,
}: {
  type: "following" | "followers";
}) {
  const router = useRouter();
  const userId = router.query.userId as string;

  const { users, isLoading, isReachingEnd, isError, loadMore } = useFollowList(
    userId,
    type,
  );
  const { t } = useTranslation();
  const { user } = useUser();
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  // 自分の非公開アカウントのフォロワー一覧でのみ、閲覧権限の状態と管理への入口を出す
  const isOwnPrivateFollowers =
    type === "followers" && user?.userId === userId && user?.isPublic === 0;
  const { requests } = useFollowRequests();
  const { approved } = useViewPermissions(isOwnPrivateFollowers);
  const pendingIds = new Set(requests.map((r) => r.requesterId));
  const approvedIds = new Set(approved.map((f) => f.followerId));
  const permissionOf = (id: string) =>
    !isOwnPrivateFollowers
      ? undefined
      : approvedIds.has(id)
        ? ("approved" as const)
        : pendingIds.has(id)
          ? ("pending" as const)
          : undefined;

  if (!userId) return null;

  const handleTabChange = (value: string) => {
    router.push(`/users/${userId}/${value}`, undefined, {
      shallow: true,
    });
  };

  return (
    <UserProfileLayout userId={userId} currentTab="">
      <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-4 md:p-6 shadow-xl backdrop-blur-md">
        <Tabs value={type} onValueChange={handleTabChange} className="w-full">
          <AppTabsGroup
            visual="pill"
            iconOnly
            listClassName="mb-6"
            tabs={[
              {
                value: "following",
                label: t("profile.follow.following"),
                icon: UserCheck,
              },
              {
                value: "followers",
                label: t("profile.follow.followers"),
                icon: Users,
              },
            ]}
          />

          <TabsContent
            value={type}
            className="mt-0 flex flex-col gap-4 outline-none"
          >
            {isOwnPrivateFollowers && (
              // 閲覧権限の状況（承認済み/承認待ちの件数）と管理への入口。フォロワー一覧が空でも出す
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-bpim-primary" />
                  <span className="text-sm font-bold text-bpim-text">
                    {t("viewPermissions.title")}
                  </span>
                  <Badge
                    variant="secondary"
                    className="px-1.5 text-[10px] font-bold"
                  >
                    {t("viewPermissions.badge.approved")} {approved.length}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-1.5 text-[10px] font-bold"
                  >
                    {t("viewPermissions.badge.pending")} {requests.length}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  className="h-8 shrink-0 px-4 text-xs font-bold"
                  onClick={() => setIsPermissionsOpen(true)}
                >
                  {t("common.manage")}
                </Button>
              </div>
            )}
            {isError ? (
              <FetchErrorState error={isError} />
            ) : users.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm font-medium text-bpim-muted">
                  {t("profile.follow.noUsers")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {users.map((followUser) => (
                    <UserFollowCard
                      key={followUser.userId}
                      user={followUser}
                      permission={permissionOf(followUser.userId)}
                    />
                  ))}
                </div>

                {!isReachingEnd && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : null}
                      {t("profile.follow.loadMore")}
                    </Button>
                  </div>
                )}

                {isLoading && users.length === 0 && (
                  <SectionLoader className="py-10" />
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <ViewPermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
      />
    </UserProfileLayout>
  );
}
