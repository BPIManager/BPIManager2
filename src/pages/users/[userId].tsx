"use client";

import { useRouter } from "next/router";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter/ui";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { BpmBpiDistributionSection } from "@/components/partials/DashBoard/BpmBpiDistribution";
import { SongsTable } from "@/components/partials/Table";
import { latestVersion } from "@/constants/latestVersion";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/versions";
import { RadarSection } from "@/components/partials/DashBoard/Radar/ui";
import { BpiHistorySection } from "@/components/partials/DashBoard/TotalBPIHistory";
import { IidxTowerSection } from "@/components/partials/DashBoard/IidxTowerCard";
import { LogFilterSection } from "@/components/partials/Logs/VersionSelector/ui";
import { TabsContent } from "@/components/ui/tabs";
import { useState } from "react";

interface UserPageProps {
  defaultView?: "overview" | "songs" | "logs";
}

export default function UserPage({ defaultView = "overview" }: UserPageProps) {
  const router = useRouter();
  const userId = router.query.userId as string;
  const version = (router.query.version as string) || latestVersion;
  const groupedBy = (router.query.groupedBy as string) || "lastPlayed";
  const [_nodata, setNodata] = useState<boolean>(false);

  if (!userId) return null;

  return (
    <UserProfileLayout userId={userId} currentTab={defaultView}>
      <ProfileMeta
        title={defaultView === "overview" ? "プロフィール" : `スコア一覧`}
        description={
          defaultView === "overview"
            ? `$userName$さん($iidxid$)のbeatmaniaIIDX ${getVersionNameFromNumber(version)}のプレイログに関するプロフィールページです。 | $profileText$`
            : `$userName$さん($iidxid$)がbeatmaniaIIDX ${getVersionNameFromNumber(version)}で記録したスコア一覧を表示します。`
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
            <IidxTowerSection userId={userId} showImportAlert={false} />
            <RadarSection userId={userId} />
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
            <LogFilterSection version={version} groupedBy={groupedBy as any} />
            <div className="mt-6">
              <LogsList
                userId={userId}
                version={version}
                groupedBy={groupedBy as any}
              />
            </div>
          </div>
        )}
      </TabsContent>
    </UserProfileLayout>
  );
}
