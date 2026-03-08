import {
  SimpleGrid,
  VStack,
  Spinner,
  Center,
  Box,
  Tabs,
} from "@chakra-ui/react";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import { Meta } from "@/components/partials/Head";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar/ui";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { TotalBPIHistory } from "@/components/partials/DashBoard/TotalBPIHistory/ui";
import { PageContainer } from "@/components/partials/Header";
import { useRouter } from "next/router";
import { ProfileSideBar } from "@/components/partials/Profile/Sidebar/ui";
import { useProfile } from "@/hooks/users/useProfile";
import { ProfileErrorState } from "@/components/partials/Profile/Errors/ui";
import { LuLayoutDashboard, LuMusic } from "react-icons/lu";
import { SongsTable } from "@/components/partials/Table";
import { latestVersion } from "@/constants/latestVersion";

export default function UserPage({
  defaultView = "overview",
}: {
  defaultView: "overview" | "songs";
}) {
  const { isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const userId = router.query.userId as string;

  const { profile, isLoading, isError, isPrivate, isNotFound } =
    useProfile(userId);

  const isGlobalLoading =
    isUserLoading || !router.isReady || (isLoading && !isError);

  const handleTabChange = (details: { value: string }) => {
    if (details.value === "overview") {
      router.push(`/user/${userId}`, undefined, { shallow: true });
    } else if (details.value === "songs") {
      const baseUrl = `/user/${userId}/scores/${latestVersion}`;
      const params = new URLSearchParams({
        difficulties: "LEGGENDARIA,HYPER,ANOTHER",
        levels: "12,11",
      });
      router.push(`${baseUrl}?${params.toString()}`, undefined, {
        shallow: true,
      });
    }
  };

  if (isGlobalLoading) {
    return (
      <DashboardLayout>
        <Center h="90vh">
          <Spinner color="blue.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (!userId) return null;

  if (isPrivate || isNotFound || isError || !profile) {
    const errorType = isPrivate ? "private" : isNotFound ? "notfound" : "error";
    return (
      <DashboardLayout>
        <PageContainer>
          <ProfileErrorState type={errorType} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  const bpiValue = profile.current
    ? Number(profile.current.totalBpi ?? -15).toFixed(2)
    : "N/A";
  const arena = profile.current?.arenaRank ?? "N/A";
  const description = `IIDXID: ${profile.iidxId} / ${profile.userName}さんのプロフィール。総合BPI: ${bpiValue} / アリーナランク: ${arena} | ${profile.profileText || ""}`;

  return (
    <FilterProvider>
      <Meta
        noIndex={profile.isPublic !== 1}
        title={`${profile.userName}のプロフィール`}
        description={description}
        ogImage={profile.profileImage || "/ogp-default.png"}
        ogType="article"
      />
      <DashboardLayout>
        <PageContainer>
          <SimpleGrid columns={{ base: 1, lg: 4 }} gap={8}>
            <Box gridColumn={{ lg: "span 1" }}>
              <ProfileSideBar profile={profile} />
            </Box>

            <Box gridColumn={{ lg: "span 3" }}>
              <Tabs.Root
                defaultValue={defaultView}
                onValueChange={handleTabChange}
                variant="enclosed"
                colorPalette="blue"
              >
                <Tabs.List
                  bg="#0d1117"
                  borderRadius="lg"
                  p={1}
                  mb={6}
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  width="full"
                  display="flex"
                >
                  <Tabs.Trigger value="overview" gap={2} flex="1" py={3}>
                    <LuLayoutDashboard />
                    サマリ
                  </Tabs.Trigger>
                  <Tabs.Trigger value="songs" gap={2} flex="1" py={3}>
                    <LuMusic />
                    スコア
                  </Tabs.Trigger>
                  <Tabs.Indicator />
                </Tabs.List>

                <Tabs.Content value="overview">
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

                <Tabs.Content value="songs">
                  <Box
                    bg="#0d1117"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    p={4}
                  >
                    <SongsTable
                      userId={userId}
                      version={String(router.query.version) || latestVersion}
                    />
                  </Box>
                </Tabs.Content>
              </Tabs.Root>
            </Box>
          </SimpleGrid>
        </PageContainer>
      </DashboardLayout>
    </FilterProvider>
  );
}
