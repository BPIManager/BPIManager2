"use client";

import { ReactNode } from "react";
import { useRouter } from "next/router";
import { useProfile } from "@/hooks/users/useProfile";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { ProfileSideBar } from "@/components/partials/Profile/Sidebar/ui";
import { ProfileErrorState } from "@/components/partials/Profile/Errors/ui";
import { ModeSwitchBanner } from "../../Rivals/ModeSwitch/ui";
import { Tabs } from "@/components/ui/tabs";
import { latestVersion } from "@/constants/latestVersion";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { LayoutDashboard, Music, Table, History } from "lucide-react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";

interface UserProfileLayoutProps {
  userId: string;
  currentTab: "overview" | "songs" | "logs" | "aaaTable" | "";
  children: ReactNode;
}

export const UserProfileLayout = ({
  userId,
  currentTab,
  children,
}: UserProfileLayoutProps) => {
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
  } = useProfile(userId);
  const version = (router.query.version as string) || latestVersion;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
  }).toString();

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
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
                type="user"
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
                  <AppTabsList visual="card" cols={4} className="mb-4 mx-auto">
                    {[
                      {
                        value: "overview",
                        href: `/users/${userId}`,
                        label: "サマリ",
                        icon: LayoutDashboard,
                      },
                      {
                        value: "songs",
                        href: `/users/${userId}/scores/${latestVersion}?${scoreParams}`,
                        label: "スコア",
                        icon: Music,
                      },
                      {
                        value: "logs",
                        href: `/users/${userId}/logs/${version}`,
                        label: "更新履歴",
                        icon: History,
                      },
                      {
                        value: "aaaTable",
                        href: `/users/${userId}/aaaTable/${version}`,
                        label: "AAA達成表",
                        icon: Table,
                      },
                    ].map((t) => (
                      <AppTabsTrigger
                        key={t.value}
                        value={t.value}
                        visual="card"
                        icon={t.icon}
                        href={t.href}
                        iconOnly
                      >
                        {t.label}
                      </AppTabsTrigger>
                    ))}
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
