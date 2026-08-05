import LogsSummaryPageShell from "@/components/partials/shell/LogsSummaryPageShell";
import PublicLogsCard from "@/components/partials/common/Logs/PublicLogsCard";
import LogsDetailContent from "@/components/partials/common/Logs/LogsDetail/content";
import LogsDetailView from "@/components/partials/common/Logs/LogsDetail";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import UserProfileLayout from "@/components/partials/common/Profile/Layout/layout";
import ProfileMeta from "@/components/partials/common/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import dayjs from "@/lib/dayjs";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function MonthlyLogsPage() {
  const { t } = useTranslation();

  return (
    <LogsSummaryPageShell
      ownProfile={({ userId, version, query }) => (
        <DashboardLayout>
          <LogsDetailView
            type="monthly"
            userId={userId}
            version={version}
            date={query.date as string}
          />
        </DashboardLayout>
      )}
      publicProfile={({ userId, version, query }) => {
        const dateStr = query.date as string;
        const monthLabel = dateStr
          ? dayjs.tz(dateStr).format(t("format.monthYear"))
          : "";
        return (
          <UserProfileLayout userId={userId} currentTab="logs">
            <ProfileMeta
              title={`${monthLabel}${t("page.monthlySummary.titleSuffix")}`}
              description={`${t("profile.desc.datePre")}${monthLabel}${t("profile.desc.dateMid")}${getVersionNameFromNumber(Number(version))}${t("profile.desc.datePost")}`}
            />
            <PublicLogsCard>
              <LogsDetailContent
                isPublicPage
                type="monthly"
                userId={userId}
                version={version}
                date={dateStr}
              />
            </PublicLogsCard>
          </UserProfileLayout>
        );
      }}
    />
  );
}
