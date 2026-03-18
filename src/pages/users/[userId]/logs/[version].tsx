"use client";

import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { Meta } from "@/components/partials/Head";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { latestVersion } from "@/constants/latestVersion";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/versions";
import { LogFilterSection } from "@/components/partials/Logs/VersionSelector/ui";
import { cn } from "@/lib/utils";

export default function LogsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  const { userId, version, groupedBy } = router.query;
  const uid = (userId as string) || "";
  const v = (version as string) || latestVersion;
  const g = (groupedBy as string) || "lastPlayed";

  const isOwnedByMe = !isUserLoading && user?.userId === userId;

  const logsContent = (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "rounded-2xl transition-all",
          isOwnedByMe
            ? "bg-transparent p-0"
            : "border border-bpim-border bg-bpim-bg/40 p-4 md:p-6 shadow-xl backdrop-blur-md",
        )}
      >
        <LogFilterSection version={v} groupedBy={g} />

        <div className="mt-6">
          <LogsList userId={uid} version={v} groupedBy={g} />
        </div>
      </div>
    </div>
  );

  if (isUserLoading) return null;

  if (isOwnedByMe && user?.userId !== undefined) {
    return (
      <DashboardLayout>
        <Meta title="更新ログ" noIndex />
        <PageHeader title="更新ログ" description="スコアの更新ログと詳細情報" />
        <PageContainer>{logsContent}</PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={uid} currentTab="logs">
      <ProfileMeta
        title={`スコア更新記録`}
        description={`$userName$さん($iidxid$)がbeatmaniaIIDX ${getVersionNameFromNumber(v)}でプレイしたスコアの記録を確認できます。`}
      />
      {logsContent}
    </UserProfileLayout>
  );
}
