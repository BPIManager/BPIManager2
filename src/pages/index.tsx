"use client";

import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import LoginPage from "@/components/partials/LogIn/ui";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter/ui";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar";
import { CurrentBpiSection } from "@/components/partials/DashBoard/CurrentBpi";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { BpmBpiDistributionSection } from "@/components/partials/DashBoard/BpmBpiDistribution";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { RankingTabsCard } from "@/components/partials/DashBoard/RecommendedCard/ui";
import { RadarSection } from "@/components/partials/DashBoard/Radar/ui";
import { RivalWinLossSummary } from "@/components/partials/DashBoard/Rivals";
import { BpiHistorySection } from "@/components/partials/DashBoard/TotalBPIHistory";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useState } from "react";
import { NoDataAlert } from "@/components/partials/DashBoard/NoData/ui";

export default function DashboardPage() {
  const { user, isLoading: isUserLoading, fbUser } = useUser();
  const [nodata, setNodata] = useState<boolean>(false);

  if (isUserLoading) {
    return <PageLoader size="lg" />;
  }

  if (!fbUser) return <LoginPage />;

  return (
    <FilterProvider>
      <Meta noIndex title="ダッシュボード" />

      {!user && <AccountSettings />}

      <DashboardLayout>
        <PageHeader
          title="ダッシュボード"
          description="おかえりなさい！成長の軌跡を確認しましょう。"
        />

        <PageContainer>
          <div className="flex flex-col gap-6">
            <DashBoardFilter withCompare />
            {nodata && <NoDataAlert />}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              <div className="flex flex-col gap-6 2xl:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CurrentBpiSection userId={fbUser.uid} />
                  <ActivitySection setNodata={setNodata} userId={fbUser.uid} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <RankDistributionSection myUserId={fbUser.uid} />
                  <BpiDistributionSection myUserId={fbUser.uid} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                  <BpmBpiDistributionSection myUserId={fbUser.uid} />
                </div>

                <div className="flex flex-col gap-6">
                  <BpiHistorySection myUserId={fbUser.uid} />
                  <RivalWinLossSummary userId={fbUser.uid} />
                  <RadarSection userId={fbUser.uid} />
                </div>
              </div>

              <aside className="lg:sticky lg:top-24 lg:h-fit">
                <RankingTabsCard userId={fbUser.uid} />
              </aside>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    </FilterProvider>
  );
}
