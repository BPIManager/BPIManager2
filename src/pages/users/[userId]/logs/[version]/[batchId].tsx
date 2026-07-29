import { LogsSummaryPageShell } from "@/components/partials/LogsSummaryPageShell";
import { PublicLogsCard } from "@/components/partials/Logs/PublicLogsCard";
import { Meta } from "@/components/partials/Head";
import { LogsDetailContent } from "@/components/partials/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function BatchLogsPage() {
  const { t } = useTranslation();

  return (
    <LogsSummaryPageShell
      ownProfile={({ userId, version, query }) => {
        const batchId = query.batchId as string;
        return (
          <DashboardLayout>
            <Meta
              title={`${t("page.batchLog.titlePrefix")}${batchId}`}
              noIndex
            />
            <LogsDetailView
              type="batch"
              userId={userId}
              version={version}
              batchId={batchId}
            />
          </DashboardLayout>
        );
      }}
      publicProfile={({ userId, version, query }) => {
        const batchId = query.batchId as string;
        return (
          <UserProfileLayout userId={userId} currentTab="logs">
            <ProfileMeta
              title={`${t("page.batchLog.titlePrefix")}${batchId}`}
            />
            <PublicLogsCard>
              <LogsDetailContent
                isPublicPage
                type="batch"
                userId={userId}
                version={version}
                batchId={batchId}
              />
            </PublicLogsCard>
          </UserProfileLayout>
        );
      }}
    />
  );
}
