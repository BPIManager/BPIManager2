import { LogsSummaryPageShell } from "@/components/partials/shell/LogsSummaryPageShell";
import { PublicLogsCard } from "@/components/partials/features/Logs/PublicLogsCard";
import { LogsDetailContent } from "@/components/partials/features/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/features/Logs/LogsDetail";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { UserProfileLayout } from "@/components/partials/common/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/common/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import dayjs from "@/lib/dayjs";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function WeeklyLogsPage() {
  const { t } = useTranslation();

  return (
    <LogsSummaryPageShell
      ownProfile={({ userId, version, query }) => (
        <DashboardLayout>
          <LogsDetailView
            type="weekly"
            userId={userId}
            version={version}
            date={query.date as string}
          />
        </DashboardLayout>
      )}
      publicProfile={({ userId, version, query }) => {
        const dateStr = query.date as string;
        const weekLabel = dateStr
          ? (() => {
              const d = dayjs.tz(dateStr);
              return `${d.startOf("isoWeek").format(t("format.monthDay"))}${t("format.weekRangeSep")}${d.endOf("isoWeek").format(t("format.monthDay"))}`;
            })()
          : "";
        return (
          <UserProfileLayout userId={userId} currentTab="logs">
            <ProfileMeta
              title={`${weekLabel}${t("page.weeklySummary.titleSuffix")}`}
              description={`${t("profile.desc.datePre")}${weekLabel}${t("profile.desc.dateMid")}${getVersionNameFromNumber(Number(version))}${t("profile.desc.datePost")}`}
            />
            <PublicLogsCard>
              <LogsDetailContent
                isPublicPage
                type="weekly"
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
