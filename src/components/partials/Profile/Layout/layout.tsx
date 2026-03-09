import { Box, SimpleGrid, Tabs, Spinner, Center } from "@chakra-ui/react";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { ProfileSideBar } from "@/components/partials/Profile/Sidebar/ui";
import { ProfileErrorState } from "@/components/partials/Profile/Errors/ui";
import { useProfile } from "@/hooks/users/useProfile";
import { LuHistory, LuLayoutDashboard, LuMusic, LuTable } from "react-icons/lu";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { latestVersion } from "@/constants/latestVersion";
import NextLink from "next/link";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";

interface UserProfileLayoutProps {
  userId: string;
  currentTab: "overview" | "songs" | "logs" | "aaaTable";
  children: ReactNode;
}

export const UserProfileLayout = ({
  userId,
  currentTab,
  children,
}: UserProfileLayoutProps) => {
  const router = useRouter();
  const { profile, isLoading, isError, isPrivate, isNotFound } =
    useProfile(userId);
  const version = (router.query.version as string) || latestVersion;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
  }).toString();

  if (isLoading)
    return (
      <DashboardLayout>
        <Center h="90vh">
          <Spinner color="blue.500" size="xl" />
        </Center>
      </DashboardLayout>
    );

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

  return (
    <FilterProvider>
      <ProfileProvider profile={profile}>
        <DashboardLayout>
          <PageContainer>
            <SimpleGrid columns={{ base: 1, lg: 4 }} gap={8}>
              <Box gridColumn={{ lg: "span 1" }}>
                <ProfileSideBar profile={profile} />
              </Box>
              <Box gridColumn={{ lg: "span 3" }}>
                <Tabs.Root
                  value={currentTab}
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
                    <Tabs.Trigger
                      value="overview"
                      fontSize="xs"
                      asChild
                      gap={1}
                      flex="1"
                      py={3}
                    >
                      <NextLink href={`/user/${userId}`}>
                        <LuLayoutDashboard />
                        サマリ
                      </NextLink>
                    </Tabs.Trigger>

                    <Tabs.Trigger
                      value="songs"
                      fontSize="xs"
                      asChild
                      gap={1}
                      flex="1"
                      py={3}
                    >
                      <NextLink
                        href={`/user/${userId}/scores/${latestVersion}?${scoreParams}`}
                      >
                        <LuMusic />
                        スコア
                      </NextLink>
                    </Tabs.Trigger>

                    <Tabs.Trigger
                      value="logs"
                      fontSize="xs"
                      asChild
                      gap={1}
                      flex="1"
                      py={3}
                    >
                      <NextLink href={`/user/${userId}/logs/${version}`}>
                        <LuHistory />
                        更新履歴
                      </NextLink>
                    </Tabs.Trigger>

                    <Tabs.Trigger
                      value="aaaTable"
                      fontSize="xs"
                      asChild
                      gap={1}
                      flex="1"
                      py={3}
                    >
                      <NextLink href={`/user/${userId}/aaaTable/${version}`}>
                        <LuTable />
                        AAA達成表
                      </NextLink>
                    </Tabs.Trigger>
                  </Tabs.List>
                  {children}
                </Tabs.Root>
              </Box>
            </SimpleGrid>
          </PageContainer>
        </DashboardLayout>
      </ProfileProvider>
    </FilterProvider>
  );
};
