import { Clock } from "lucide-react";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import {
  SummaryCard,
  SkeletonCard,
  RegistrationTrendChart,
  ArenaRankComparison,
  VersionScoreChart,
  HourlyChart,
  WeekdayChart,
  SongPopulationTable,
  AreaDistributionTable,
} from "@/components/partials/Info";
import { useSiteStats } from "@/hooks/siteStats/useSiteStats";
import { useTranslation } from "@/hooks/common/useTranslation";

function UpdateNotice({ generatedAt }: { generatedAt?: string }) {
  const { t } = useTranslation();
  const formatted = generatedAt
    ? new Date(generatedAt).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2 text-xs text-bpim-muted">
      <Clock size={12} className="shrink-0" />
      <span>
        {t("page.stats.updateNote")}
        {formatted && <>{formatted}</>}
      </span>
    </div>
  );
}

export default function SiteStatsPage() {
  const { data, isLoading } = useSiteStats();
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta title={t("page.stats.title")} description={t("page.stats.metaDesc")} />
      <PageHeader title={t("page.stats.title")} description={t("page.stats.desc")} />
      <PageContainer>
        {isLoading || !data ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard className="h-80" />
            <SkeletonCard className="h-80" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SkeletonCard className="h-80" />
              <SkeletonCard className="h-80" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <UpdateNotice generatedAt={data.generatedAt} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard
                label={t("page.stats.registeredUsers")}
                total={data.summary.totalUsers}
                today={data.summary.newUsersToday}
                color="text-bpim-success"
              />
              <SummaryCard
                label={t("page.stats.csvImports")}
                total={data.summary.totalLogs}
                today={data.summary.newLogsToday}
                color="text-bpim-primary"
              />
              <SummaryCard
                label={t("page.stats.registeredScores")}
                total={data.summary.totalAllScores}
                today={data.summary.newAllScoresToday}
                color="text-bpim-warning"
              />
            </div>

            <RegistrationTrendChart data={data.dailyRegistrations} />
            <ArenaRankComparison selfReported={data.arenaRankDistribution} />
            <VersionScoreChart data={data.versionScoreDistribution} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HourlyChart data={data.hourlyDistribution} />
              <WeekdayChart data={data.weekdayDistribution} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SongPopulationTable
                order="top"
                title={t("page.stats.topPlayed")}
              />
              <SongPopulationTable
                order="bottom"
                title={t("page.stats.leastPlayed")}
              />
            </div>

            <AreaDistributionTable data={data.areaDistribution ?? []} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
