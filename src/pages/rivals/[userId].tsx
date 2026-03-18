import { SimpleGrid, VStack, Box, Tabs } from "@chakra-ui/react";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter";
import { RadarSection } from "@/components/partials/DashBoard/Radar";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { useProfile } from "@/hooks/users/useProfile";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { RivalProfileLayout } from "@/components/partials/Rivals/Layout/layout";
import { RivalSongsTable } from "@/components/partials/Rivals/Table";
import { Meta } from "@/components/partials/Head";
import { DistributionSection } from "@/components/partials/DashBoard/DistributionChart";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { BpiHistorySection } from "@/components/partials/DashBoard/TotalBPIHistory/ui";
import { DashCard } from "@/components/ui/chakra/dashcard";

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
    <VStack align="stretch" gap={6}>
      <DashBoardFilter />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
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
      </SimpleGrid>
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
    </VStack>
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
        <Tabs.Content value="overview" p={0}>
          <LoginRequiredCard />
        </Tabs.Content>
        <Tabs.Content value="scores" p={0}>
          <LoginRequiredCard />
        </Tabs.Content>
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

      <Tabs.Content value="overview" p={0}>
        <RivalOverviewTab
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          rivalName={rivalName}
        />
      </Tabs.Content>

      <Tabs.Content value="scores" p={0}>
        <DashCard>
          <RivalSongsTable
            myUserId={myUserId}
            rivalUserId={rivalUserId}
            rivalName={rivalName}
            version={version}
          />
        </DashCard>
      </Tabs.Content>
    </RivalProfileLayout>
  );
}
