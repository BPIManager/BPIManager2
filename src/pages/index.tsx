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
import { BpiBoxStatsSection } from "@/components/partials/DashBoard/BpiBoxStats";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useState } from "react";
import { NoDataAlert } from "@/components/partials/DashBoard/NoData/ui";
import { IidxTowerSection } from "@/components/partials/DashBoard/IidxTowerCard";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayoutSettingsModal } from "@/components/partials/DashBoard/LayoutSettings";
import { useLayoutConfig } from "@/hooks/dashboard/useLayoutConfig";
import { WidgetId } from "@/types/dashboard/layout";
import { cn } from "@/lib/utils";

function WidgetRenderer({
  id,
  userId,
  setNodata,
}: {
  id: WidgetId;
  userId: string;
  setNodata: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  switch (id) {
    case "currentBpi":
      return <CurrentBpiSection userId={userId} />;
    case "activity":
      return <ActivitySection setNodata={setNodata} userId={userId} />;
    case "rankDistribution":
      return <RankDistributionSection myUserId={userId} />;
    case "bpiDistribution":
      return <BpiDistributionSection myUserId={userId} />;
    case "bpmBpiDistribution":
      return <BpmBpiDistributionSection myUserId={userId} />;
    case "bpiHistory":
      return <BpiHistorySection myUserId={userId} />;
    case "bpiBoxStats":
      return <BpiBoxStatsSection userId={userId} />;
    case "rivalWinLoss":
      return <RivalWinLossSummary userId={userId} />;
    case "radar":
      return <RadarSection userId={userId} />;
    case "iidxTower":
      return <IidxTowerSection userId={userId} />;
    case "rankingTabs":
      return <RankingTabsCard userId={userId} />;
    default:
      return null;
  }
}

export default function DashboardPage() {
  const { user, isLoading: isUserLoading, fbUser } = useUser();
  const [nodata, setNodata] = useState<boolean>(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);
  const { config, updateConfig, hydrated } = useLayoutConfig();

  if (isUserLoading) {
    return <PageLoader size="lg" />;
  }

  if (!fbUser) return <LoginPage />;

  const visibleMainWidgets = config.widgets.filter(
    (w) => w.section === "main" && w.visible,
  );
  const visibleSidebarWidgets = config.widgets.filter(
    (w) => w.section === "sidebar" && w.visible,
  );
  const hasSidebar = visibleSidebarWidgets.length > 0;

  return (
    <FilterProvider>
      <Meta noIndex title="ダッシュボード" />

      {!user && <AccountSettings />}

      {hydrated && (
        <DashboardLayoutSettingsModal
          isOpen={isLayoutSettingsOpen}
          onClose={() => setIsLayoutSettingsOpen(false)}
          config={config}
          onSave={updateConfig}
        />
      )}

      <DashboardLayout>
        <PageHeader
          title="ダッシュボード"
          description="おかえりなさい！成長の軌跡を確認しましょう。"
          rightElement={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLayoutSettingsOpen(true)}
              className="flex items-center gap-1.5 text-bpim-muted hover:text-bpim-text"
            >
              <Settings2 className="h-4 w-4" />
              <span>レイアウトを変更</span>
            </Button>
          }
        />

        <PageContainer>
          <div className="flex flex-col gap-6">
            <DashBoardFilter withCompare />
            {nodata && <NoDataAlert />}

            <div
              className={cn(
                "grid grid-cols-1 items-start gap-6",
                hasSidebar && "lg:grid-cols-2 2xl:grid-cols-3",
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-4",
                  hasSidebar && "2xl:col-span-2",
                )}
              >
                <div
                  className={cn(
                    "grid gap-4",
                    config.mainCols === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1",
                  )}
                >
                  {visibleMainWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={cn(
                        config.mainCols === 2 && widget.width === "full"
                          ? "sm:col-span-2"
                          : "",
                      )}
                    >
                      <WidgetRenderer
                        id={widget.id}
                        userId={fbUser.uid}
                        setNodata={setNodata}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {hasSidebar && (
                <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
                  {visibleSidebarWidgets.map((widget) => (
                    <WidgetRenderer
                      key={widget.id}
                      id={widget.id}
                      userId={fbUser.uid}
                      setNodata={setNodata}
                    />
                  ))}
                </aside>
              )}
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    </FilterProvider>
  );
}
