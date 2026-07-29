import { LogsSummaryPageShell } from "@/components/partials/shell/LogsSummaryPageShell";
import { PublicLogsCard } from "@/components/partials/features/Logs/PublicLogsCard";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { UserProfileLayout } from "@/components/partials/common/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/common/Profile/Meta/ui";
import { PageHeader, PageContainer } from "@/components/partials/common/Header";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { VersionCompareContent } from "@/components/partials/features/Logs/VersionCompare/ui";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function VersionSummaryPage() {
  const { t } = useTranslation();

  return (
    <LogsSummaryPageShell
      ownProfile={({ userId, version }) => (
        <DashboardLayout>
          <PageHeader
            title={`${getVersionNameFromNumber(version)}${t("page.versionSummary.titleSuffix")}`}
            description={t("page.versionSummary.desc")}
          />
          <PageContainer>
            <VersionCompareContent userId={userId} version={version} />
          </PageContainer>
        </DashboardLayout>
      )}
      publicProfile={({ userId, version }) => (
        <UserProfileLayout userId={userId} currentTab="logs">
          <ProfileMeta
            title={`${getVersionNameFromNumber(version)}${t("page.versionSummary.titleSuffix")}`}
          />
          <PublicLogsCard>
            <VersionCompareContent
              isPublicPage
              userId={userId}
              version={version}
            />
          </PublicLogsCard>
        </UserProfileLayout>
      )}
    />
  );
}
