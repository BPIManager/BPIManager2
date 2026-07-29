import { LogsSummaryPageShell } from "@/components/partials/LogsSummaryPageShell";
import { PublicLogsCard } from "@/components/partials/Logs/PublicLogsCard";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { VersionCompareContent } from "@/components/partials/Logs/VersionCompare/ui";
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
