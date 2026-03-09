import { SimpleGrid, VStack, Box, Tabs } from "@chakra-ui/react";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar/ui";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { TotalBPIHistory } from "@/components/partials/DashBoard/TotalBPIHistory/ui";
import { useRouter } from "next/router";
import { SongsTable } from "@/components/partials/Table";
import { latestVersion } from "@/constants/latestVersion";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { LogVersionSelector } from "@/components/partials/Logs/VersionSelector.tsx/ui";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";

export default function UserPage({
  defaultView = "overview",
}: {
  defaultView: "overview" | "songs" | "logs";
}) {
  const router = useRouter();
  const userId = router.query.userId as string;
  const version = (router.query.version as string) || latestVersion;

  if (!userId) return null;

  return (
    <UserProfileLayout userId={userId} currentTab={defaultView}>
      <Tabs.Content value="overview" p={0}>
        <VStack align="stretch" gap={6}>
          <DashBoardFilter />
          <ActivitySection userId={userId} />

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <RankDistributionSection userId={userId} />
            <BpiDistributionSection userId={userId} />
          </SimpleGrid>

          <TotalBPIHistory userId={userId} />
        </VStack>
      </Tabs.Content>

      <Tabs.Content value="songs" p={0}>
        <Box
          bg="#0d1117"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.100"
          p={4}
        >
          <SongsTable userId={userId} version={version} />
        </Box>
      </Tabs.Content>

      <Tabs.Content value="logs" p={0}>
        <Box
          bg="#0d1117"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.100"
          p={6}
        >
          <LogVersionSelector version={version} />
          <Box mt={6}>
            <LogsList userId={userId} version={version} />
          </Box>
        </Box>
      </Tabs.Content>
    </UserProfileLayout>
  );
}
