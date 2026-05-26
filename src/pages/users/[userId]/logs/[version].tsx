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
import { useTranslation } from "@/hooks/common/useTranslation";

export default function LogsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { t } = useTranslation();

  const { userId, version, groupedBy, granularity } = router.query;
  const uid = (userId as string) || "";
  const v = (version as string) || latestVersion;
  const g = (groupedBy as string) || "lastPlayed";
  const gr = (granularity as string) || "day";

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
        <LogFilterSection version={v} groupedBy={g} granularity={gr} />

        <div className="mt-6">
          <LogsList userId={uid} version={v} groupedBy={g} granularity={gr} />
        </div>
      </div>
    </div>
  );

  if (isUserLoading) return null;

  if (isOwnedByMe && user?.userId !== undefined) {
    return (
      <DashboardLayout>
        <Meta title={t("page.logs.title")} noIndex />
        <PageHeader title={t("page.logs.title")} description={t("page.logs.desc")} />
        <PageContainer>{logsContent}</PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={uid} currentTab="logs">
      <ProfileMeta
        title={t("page.logs.publicTitle")}
        description={`${t("profile.desc.logsPre")}${getVersionNameFromNumber(v)}${t("profile.desc.logsPost")}`}
      />
      {logsContent}
    </UserProfileLayout>
  );
}
