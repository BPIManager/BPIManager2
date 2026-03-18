"use client";

import { ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { LuHistory, LuLayoutDashboard, LuMusic, LuTable } from "react-icons/lu";
import { useProfile } from "@/hooks/users/useProfile";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { ProfileSideBar } from "@/components/partials/Profile/Sidebar/ui";
import { ProfileErrorState } from "@/components/partials/Profile/Errors/ui";
import { ModeSwitchBanner } from "../../Rivals/ModeSwitch/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { latestVersion } from "@/constants/latestVersion";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { Loader } from "lucide-react";

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
        <div className="flex h-[90vh] items-center justify-center">
          <Loader className="h-10 w-10 animate-spin text-gray-200" />
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
                  <TabsList className="mb-6 grid h-12 w-full grid-cols-2 items-stretch rounded-xl border border-bpim-border bg-bpim-card/50 p-1.5 md:grid-cols-4">
                    <TabLinkItem
                      value="overview"
                      href={`/users/${userId}`}
                      label="サマリ"
                      icon={<LuLayoutDashboard className="h-4 w-4" />}
                    />
                    <TabLinkItem
                      value="songs"
                      href={`/users/${userId}/scores/${latestVersion}?${scoreParams}`}
                      label="スコア"
                      icon={<LuMusic className="h-4 w-4" />}
                    />
                    <TabLinkItem
                      value="logs"
                      href={`/users/${userId}/logs/${version}`}
                      label="更新履歴"
                      icon={<LuHistory className="h-4 w-4" />}
                    />
                    <TabLinkItem
                      value="aaaTable"
                      href={`/users/${userId}/aaaTable/${version}`}
                      label="AAA達成表"
                      icon={<LuTable className="h-4 w-4" />}
                    />
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

const TabLinkItem = ({
  value,
  href,
  label,
  icon,
}: {
  value: string;
  href: string;
  label: string;
  icon: React.ReactNode;
}) => (
  <TabsTrigger
    value={value}
    asChild
    className="flex h-full items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
  >
    <NextLink href={href}>
      {icon}
      <span>{label}</span>
    </NextLink>
  </TabsTrigger>
);
