"use client";

import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { useProfile } from "@/hooks/users/useProfile";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { RivalProfileLayout } from "@/components/partials/Rivals/Layout/layout";
import { RivalSongsTable } from "@/components/partials/Rivals/Table";
import { Meta } from "@/components/partials/Head";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter/ui";
import { RadarSection } from "@/components/partials/DashBoard/Radar/ui";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { BpmBpiDistributionSection } from "@/components/partials/DashBoard/BpmBpiDistribution";
import { BpiHistorySection } from "@/components/partials/DashBoard/TotalBPIHistory";
import { TabsContent } from "@/components/ui/tabs";

function RivalOverviewTab({
  myUserId,
  rivalUserId,
  rivalName,
}: {
  myUserId: string;
  rivalUserId: string;
  rivalName?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <DashBoardFilter />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RankDistributionSection
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          myName="自分"
          rivalName={rivalName}
        />
        <BpiDistributionSection
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          myName="自分"
          rivalName={rivalName}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
        <BpmBpiDistributionSection
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          myName="自分"
          rivalName={rivalName}
        />
      </div>

      <BpiHistorySection
        myUserId={myUserId}
        rivalUserId={rivalUserId}
        myName="自分"
        rivalName={rivalName}
      />

      <RadarSection
        userId={myUserId}
        rivalUserId={rivalUserId}
        rivalName={rivalName}
      />
    </div>
  );
}

export default function RivalsUserPage({
  defaultView = "overview",
}: {
  defaultView: "overview" | "scores";
}) {
  const router = useRouter();
  const rivalUserId = router.query.userId as string;
  const version = (router.query.version as string) || latestVersion;
  const { user } = useUser();

  const { profile: rivalProfile } = useProfile(rivalUserId);
  const rivalName = rivalProfile?.userName;

  if (!rivalUserId) return null;

  if (!user) {
    return (
      <RivalProfileLayout rivalUserId={rivalUserId} currentTab={defaultView}>
        <TabsContent value="overview" className="mt-0 outline-none">
          <LoginRequiredCard />
        </TabsContent>
        <TabsContent value="scores" className="mt-0 outline-none">
          <LoginRequiredCard />
        </TabsContent>
      </RivalProfileLayout>
    );
  }

  const myUserId = user.userId;

  return (
    <RivalProfileLayout rivalUserId={rivalUserId} currentTab={defaultView}>
      <Meta
        title={`${rivalName ? rivalName + "さん" : "ライバル"}とのスコア比較`}
        noIndex
      />

      <TabsContent value="overview" className="mt-0 outline-none">
        <RivalOverviewTab
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          rivalName={rivalName}
        />
      </TabsContent>

      <TabsContent value="scores" className="mt-0 outline-none">
        <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-1 shadow-xl backdrop-blur-md overflow-hidden">
          <RivalSongsTable
            myUserId={myUserId}
            rivalUserId={rivalUserId}
            version={version}
          />
        </div>
      </TabsContent>
    </RivalProfileLayout>
  );
}
