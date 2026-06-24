import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution";
import { BpmBpiDistributionSection } from "@/components/partials/DashBoard/BpmBpiDistribution";
import { SongsTable } from "@/components/partials/Table";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { RadarSection } from "@/components/partials/DashBoard/Radar/ui";
import { BpiHistorySection } from "@/components/partials/DashBoard/TotalBPIHistory";
import { IidxTowerSection } from "@/components/partials/DashBoard/IidxTowerCard";
import { OfficialArenaHistorySection } from "@/components/partials/DashBoard/OfficialArenaHistoryCard";
import { LogFilterSection } from "@/components/partials/Logs/VersionSelector/ui";
import { TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { BpiBoxStatsSection } from "@/components/partials/DashBoard/BpiBoxStats";
import { useTranslation } from "@/hooks/common/useTranslation";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

interface UserPageProps {
  defaultView?: "overview" | "songs" | "logs";
}

export default function UserPage({ defaultView = "overview" }: UserPageProps) {
  const router = useRouter();
  const userId = router.query.userId as string;
  const version = (router.query.version as string) || latestVersion;
  const groupedBy = (router.query.groupedBy as string) || "lastPlayed";
  const granularity = (router.query.granularity as string) || "day";
  const [_nodata, setNodata] = useState<boolean>(false);
  const { t } = useTranslation();

  if (!userId) return null;

  return (
    <UserProfileLayout userId={userId} currentTab={defaultView}>
      <ProfileMeta
        title={
          defaultView === "overview"
            ? t("page.profile.overview")
            : t("page.profile.scoreList")
        }
        description={
          defaultView === "overview"
            ? `${t("profile.desc.overviewPre")}${getVersionNameFromNumber(version)}${t("profile.desc.overviewPost")}`
            : `${t("profile.desc.scoresPre")}${getVersionNameFromNumber(version)}${t("profile.desc.scoresPost")}`
        }
      />

      <TabsContent
        value="overview"
        className="mt-0 border-none p-0 outline-none"
      >
        {defaultView === "overview" && (
          <div className="flex flex-col gap-6">
            <DashBoardFilter />

            <ActivitySection setNodata={setNodata} userId={userId} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RankDistributionSection myUserId={userId} />
              <BpiDistributionSection myUserId={userId} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
              <BpmBpiDistributionSection myUserId={userId} />
            </div>

            <BpiHistorySection myUserId={userId} />
            <BpiBoxStatsSection userId={userId} />
            <IidxTowerSection
              userId={userId}
              showImportAlert={false}
              defaultPeriod={0}
            />
            <RadarSection userId={userId} />
            <OfficialArenaHistorySection userId={userId} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="songs" className="mt-0 border-none p-0 outline-none">
        {defaultView === "songs" && (
          <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-1 shadow-xl backdrop-blur-md overflow-hidden">
            <SongsTable userId={userId} version={version} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="logs" className="mt-0 border-none p-0 outline-none">
        {defaultView === "logs" && (
          <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-4 md:p-6 shadow-xl backdrop-blur-md">
            <LogFilterSection
              version={version}
              groupedBy={groupedBy}
              granularity={granularity}
            />
            <div className="mt-6">
              <LogsList
                userId={userId}
                version={version}
                groupedBy={groupedBy}
                granularity={granularity}
              />
            </div>
          </div>
        )}
      </TabsContent>
    </UserProfileLayout>
  );
}
