import { Clock } from "lucide-react";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import {
  SummaryCard,
  SkeletonCard,
  RegistrationTrendChart,
  ArenaRankChart,
  VersionScoreChart,
  HourlyChart,
  WeekdayChart,
  SongPopulationTable,
} from "@/components/partials/Info";
import { useSiteStats } from "@/hooks/siteStats/useSiteStats";

function UpdateNotice({ generatedAt }: { generatedAt?: string }) {
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
        前日までのデータが毎日 01:00 (JST) に更新されます。
        {formatted && <>最終更新: {formatted}</>}
      </span>
    </div>
  );
}

export default function SiteStatsPage() {
  const { data, isLoading } = useSiteStats();

  return (
    <DashboardLayout>
      <Meta title="統計情報" description="BPIM2のサービス利用統計情報" />
      <PageHeader title="統計情報" description="BPIM2の利用統計です" />
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
                label="登録ユーザー数"
                total={data.summary.totalUsers}
                today={data.summary.newUsersToday}
                color="text-bpim-success"
              />
              <SummaryCard
                label="CSV読み込み回数"
                total={data.summary.totalLogs}
                today={data.summary.newLogsToday}
                color="text-bpim-primary"
              />
              <SummaryCard
                label="登録スコア"
                total={data.summary.totalAllScores}
                today={data.summary.newAllScoresToday}
                color="text-bpim-warning"
              />
            </div>

            <RegistrationTrendChart data={data.dailyRegistrations} />
            <ArenaRankChart data={data.arenaRankDistribution} />
            <VersionScoreChart data={data.versionScoreDistribution} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HourlyChart data={data.hourlyDistribution} />
              <WeekdayChart data={data.weekdayDistribution} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SongPopulationTable
                order="top"
                title="楽曲別プレイ人口 TOP (☆12)"
              />
              <SongPopulationTable
                order="bottom"
                title="楽曲別プレイ人口 ワースト (☆12)"
              />
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
