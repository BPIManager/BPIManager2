"use client";

import { ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
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
import { Loader, LayoutDashboard, Music } from "lucide-react";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";

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
          <Loader className="h-10 w-10 animate-spin text-bpim-text" />
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
                  <AppTabsList visual="card" cols={2} className="mb-6">
                    <AppTabsTrigger
                      value="overview"
                      visual="card"
                      icon={LayoutDashboard}
                      href={`/rivals/${rivalUserId}`}
                      iconOnly
                    >
                      サマリ
                    </AppTabsTrigger>
                    <AppTabsTrigger
                      value="scores"
                      visual="card"
                      icon={Music}
                      href={`/rivals/${rivalUserId}/scores/${version}?${scoreParams}`}
                      iconOnly
                    >
                      スコア比較
                    </AppTabsTrigger>
                  </AppTabsList>
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
