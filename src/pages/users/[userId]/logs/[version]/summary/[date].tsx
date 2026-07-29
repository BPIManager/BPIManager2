import { LogsSummaryPageShell } from "@/components/partials/shell/LogsSummaryPageShell";
import { PublicLogsCard } from "@/components/partials/features/Logs/PublicLogsCard";
import { LogsDetailContent } from "@/components/partials/features/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/features/Logs/LogsDetail";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { UserProfileLayout } from "@/components/partials/common/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/common/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function SummaryLogsPage() {
  const { t } = useTranslation();

  return (
    <LogsSummaryPageShell
      ownProfile={({ userId, version, query }) => (
        <DashboardLayout>
          <LogsDetailView
            type="daily"
            userId={userId}
            version={version}
            date={query.date as string}
          />
        </DashboardLayout>
      )}
      publicProfile={({ userId, version, query }) => {
        const date = query.date as string;
        return (
          <UserProfileLayout userId={userId} currentTab="logs">
            <ProfileMeta
              title={`${date}${t("page.dailySummary.titleSuffix")}`}
              description={`${t("profile.desc.datePre")}${date}${t("profile.desc.dateMid")}${getVersionNameFromNumber(Number(version))}${t("profile.desc.datePost")}`}
            />
            <PublicLogsCard>
              <LogsDetailContent
                isPublicPage
                type="daily"
                userId={userId}
                version={version}
                date={date}
              />
            </PublicLogsCard>
          </UserProfileLayout>
        );
      }}
    />
  );
}
