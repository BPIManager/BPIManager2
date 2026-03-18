import { SimpleGrid, VStack, Box, Tabs } from "@chakra-ui/react";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar/ui";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { useRouter } from "next/router";
import { SongsTable } from "@/components/partials/Table";
import { latestVersion } from "@/constants/latestVersion";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/versions";
import { RadarSection } from "@/components/partials/DashBoard/Radar";
import { BpiHistorySection } from "@/components/partials/DashBoard/TotalBPIHistory/ui";
import { LogFilterSection } from "@/components/partials/Logs/VersionSelector/ui";
import { DashCard } from "@/components/ui/chakra/dashcard";

export default function UserPage({
  defaultView = "overview",
}: {
  defaultView: "overview" | "songs" | "logs";
}) {
  const router = useRouter();
  const userId = router.query.userId as string;
  const version = (router.query.version as string) || latestVersion;
  const groupedBy = (router.query.groupedBy as string) || "lastPlayed";

  if (!userId) return null;

  return (
    <UserProfileLayout userId={userId} currentTab={defaultView}>
      <ProfileMeta
        title={defaultView === "overview" ? "プロフィール" : `スコア一覧`}
        description={
          defaultView === "overview"
            ? `$userName$さん($iidxid$)のbeatmaniaIIDX ${getVersionNameFromNumber(Number(version))}のプレイログに関するプロフィールページです。 | $profileText$`
            : `$userName$さん($iidxid$)がbeatmaniaIIDX ${getVersionNameFromNumber(Number(version))}で記録したスコア一覧を表示します。`
        }
      />
      <Tabs.Content value="overview" p={0}>
        {defaultView === "overview" && (
          <VStack align="stretch" gap={6}>
            <DashBoardFilter />
            <ActivitySection userId={userId} />

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <RankDistributionSection myUserId={userId} />
              <BpiDistributionSection myUserId={userId} />
            </SimpleGrid>
            <BpiHistorySection myUserId={userId} />
            <RadarSection userId={userId} />
          </VStack>
        )}
      </Tabs.Content>

      <Tabs.Content value="songs" p={0}>
        {defaultView === "songs" && (
          <DashCard>
            <SongsTable userId={userId} version={version} />
          </DashCard>
        )}
      </Tabs.Content>

      <Tabs.Content value="logs" p={0}>
        {defaultView === "logs" && (
          <DashCard>
            <LogFilterSection version={version} groupedBy={groupedBy as any} />
            <Box mt={6}>
              <LogsList
                userId={userId}
                version={version}
                groupedBy={groupedBy as any}
              />
            </Box>
          </DashCard>
        )}
      </Tabs.Content>
    </UserProfileLayout>
  );
}
