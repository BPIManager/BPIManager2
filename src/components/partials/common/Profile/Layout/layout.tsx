"use client";

import { ReactNode } from "react";
import { useRouter } from "next/router";
import { ProfileLayoutShell } from "@/components/partials/shell/ProfileLayoutShell";
import { Tabs } from "@/components/ui/tabs";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { LayoutDashboard, Music, Table, History } from "lucide-react";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";

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
  const { t } = useTranslation();
  const version = (router.query.version as string) || latestVersion;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
  }).toString();

  return (
    <ProfileLayoutShell userId={userId} bannerType="user">
      {() => (
        <Tabs value={currentTab} className="w-full">
          <AppTabsList visual="card" cols={4} className="mb-4 mx-auto">
            {[
              {
                value: "overview",
                href: `/users/${userId}`,
                label: t("profile.tab.overview"),
                icon: LayoutDashboard,
              },
              {
                value: "songs",
                href: `/users/${userId}/scores/${latestVersion}?${scoreParams}`,
                label: t("profile.tab.scores"),
                icon: Music,
              },
              {
                value: "logs",
                href: `/users/${userId}/logs/${version}`,
                label: t("profile.tab.history"),
                icon: History,
              },
              {
                value: "aaaTable",
                href: `/users/${userId}/aaaTable/${version}`,
                label: t("profile.tab.aaaTable"),
                icon: Table,
              },
            ].map((tab) => (
              <AppTabsTrigger
                key={tab.value}
                value={tab.value}
                visual="card"
                icon={tab.icon}
                href={tab.href}
                iconOnly
              >
                {tab.label}
              </AppTabsTrigger>
            ))}
          </AppTabsList>
          {children}
        </Tabs>
      )}
    </ProfileLayoutShell>
  );
};
