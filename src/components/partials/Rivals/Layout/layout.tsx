"use client";

import { ReactNode } from "react";
import { useRouter } from "next/router";
import { ProfileLayoutShell } from "@/components/partials/common/ProfileLayoutShell";
import { Tabs } from "@/components/ui/tabs";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { LayoutDashboard, Music } from "lucide-react";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";

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
  const { t } = useTranslation();
  const version = (router.query.version as string) || latestVersion;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
    isMyPlayed: "true",
    isRivalPlayed: "true",
  }).toString();

  return (
    <ProfileLayoutShell userId={rivalUserId} bannerType="rival">
      {() => (
        <Tabs value={currentTab} className="w-full">
          <AppTabsList visual="card" cols={2} className="mb-6">
            <AppTabsTrigger
              value="overview"
              visual="card"
              icon={LayoutDashboard}
              href={`/rivals/${rivalUserId}`}
              iconOnly
            >
              {t("page.rival.tabOverview")}
            </AppTabsTrigger>
            <AppTabsTrigger
              value="scores"
              visual="card"
              icon={Music}
              href={`/rivals/${rivalUserId}/scores/${version}?${scoreParams}`}
              iconOnly
            >
              {t("page.rival.tabScores")}
            </AppTabsTrigger>
          </AppTabsList>
          {children}
        </Tabs>
      )}
    </ProfileLayoutShell>
  );
};
