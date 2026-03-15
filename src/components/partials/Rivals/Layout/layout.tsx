import {
  Box,
  SimpleGrid,
  Tabs,
  Spinner,
  Center,
  HStack,
  Text,
  Badge,
} from "@chakra-ui/react";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { ProfileSideBar } from "@/components/partials/Profile/Sidebar/ui";
import { ProfileErrorState } from "@/components/partials/Profile/Errors/ui";
import { useProfile } from "@/hooks/users/useProfile";
import { useUser } from "@/contexts/users/UserContext";
import {
  LuChevronRight,
  LuLayoutDashboard,
  LuMusic,
  LuSwords,
  LuUser,
} from "react-icons/lu";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { latestVersion } from "@/constants/latestVersion";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { ModeSwitchBanner } from "../ModeSwitch/ui";
import { DashCard } from "@/components/ui/dashcard";

interface RivalProfileLayoutProps {
  rivalUserId: string;
  currentTab: "overview" | "scores";
  children: ReactNode;
}

export const RivalProfileLayout = ({
  rivalUserId,
  currentTab,
  children,
}: RivalProfileLayoutProps) => {
  const router = useRouter();
  const { user } = useUser();
  const {
    profile,
    isLoading,
    isError,
    isPrivate,
    isNotFound,
    toggleFollow,
    isUpdating,
    mutate,
  } = useProfile(rivalUserId);
  const version = (router.query.version as string) || latestVersion;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
    isMyPlayed: "true",
    isRivalPlayed: "true",
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
            {user && (
              <ModeSwitchBanner
                type="rival"
                targetUserId={profile.userId}
                isMe={user.userId === profile.userId}
              />
            )}

            <SimpleGrid columns={{ base: 1, lg: 4 }} gap={8}>
              <Box gridColumn={{ lg: "span 1" }}>
                <ProfileSideBar
                  profile={profile}
                  onFollowToggle={toggleFollow}
                  isUpdating={isUpdating}
                />
              </Box>
              <Box gridColumn={{ lg: "span 3" }}>
                <Tabs.Root
                  value={currentTab}
                  variant="enclosed"
                  colorPalette="blue"
                >
                  <DashCard as={Tabs.List} p={1} mb={6}>
                    <Tabs.Trigger
                      value="overview"
                      fontSize="xs"
                      asChild
                      gap={1}
                      flex="1"
                      py={3}
                    >
                      <NextLink href={`/rivals/${rivalUserId}`}>
                        <LuLayoutDashboard />
                        サマリ
                      </NextLink>
                    </Tabs.Trigger>

                    <Tabs.Trigger
                      value="scores"
                      fontSize="xs"
                      asChild
                      gap={1}
                      flex="1"
                      py={3}
                    >
                      <NextLink
                        href={`/rivals/${rivalUserId}/scores/${version}?${scoreParams}`}
                      >
                        <LuMusic />
                        スコア比較
                      </NextLink>
                    </Tabs.Trigger>
                  </DashCard>
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
