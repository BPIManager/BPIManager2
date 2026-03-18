"use client";

import { ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { LuLayoutDashboard, LuMusic, LuLoader } from "react-icons/lu";
import { useProfile } from "@/hooks/users/useProfile";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { ProfileSideBar } from "@/components/partials/Profile/Sidebar/ui";
import { ProfileErrorState } from "@/components/partials/Profile/Errors/ui";
import { ModeSwitchBanner } from "../ModeSwitch/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { latestVersion } from "@/constants/latestVersion";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { FilterProvider } from "@/contexts/stats/FilterContext";

export const RivalProfileLayout = ({
  rivalUserId,
  currentTab,
  children,
}: {
  rivalUserId: string;
  currentTab: "overview" | "scores";
  children: ReactNode;
}) => {
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
  } = useProfile(rivalUserId);
  const version = (router.query.version as string) || latestVersion;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
    isMyPlayed: "true",
    isRivalPlayed: "true",
  }).toString();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[90vh] items-center justify-center">
          <LuLoader className="h-10 w-10 animate-spin text-bpim-text" />
        </div>
      </DashboardLayout>
    );
  }

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

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <aside className="lg:col-span-1">
                <ProfileSideBar
                  profile={profile}
                  onFollowToggle={toggleFollow}
                  isUpdating={isUpdating}
                />
              </aside>

              <div className="lg:col-span-3">
                <Tabs value={currentTab} className="w-full">
                  <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-xl border border-bpim-border bg-bpim-bg/50 p-1">
                    <TabsTrigger
                      value="overview"
                      asChild
                      className="flex items-center gap-2 py-3 text-xs font-bold data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text"
                    >
                      <NextLink href={`/rivals/${rivalUserId}`}>
                        <LuLayoutDashboard className="h-4 w-4" />
                        サマリ
                      </NextLink>
                    </TabsTrigger>
                    <TabsTrigger
                      value="scores"
                      asChild
                      className="flex items-center gap-2 py-3 text-xs font-bold data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text"
                    >
                      <NextLink
                        href={`/rivals/${rivalUserId}/scores/${version}?${scoreParams}`}
                      >
                        <LuMusic className="h-4 w-4" />
                        スコア比較
                      </NextLink>
                    </TabsTrigger>
                  </TabsList>
                  {children}
                </Tabs>
              </div>
            </div>
          </PageContainer>
        </DashboardLayout>
      </ProfileProvider>
    </FilterProvider>
  );
};
