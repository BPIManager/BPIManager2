"use client";

import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LogsList } from "@/components/partials/features/Logs/LogsList/ui";
import { PublicLogsCard } from "@/components/partials/features/Logs/PublicLogsCard";
import { Meta } from "@/components/partials/common/Head";
import { PageHeader, PageContainer } from "@/components/partials/common/Header";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { UserProfileLayout } from "@/components/partials/common/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/common/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { LogFilterSection } from "@/components/partials/features/Logs/VersionSelector/ui";
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
      <PublicLogsCard isOwnProfile={isOwnedByMe}>
        <LogFilterSection version={v} groupedBy={g} granularity={gr} />

        <div className="mt-6">
          <LogsList userId={uid} version={v} groupedBy={g} granularity={gr} />
        </div>
      </PublicLogsCard>
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
