"use client";

import { ReactNode } from "react";
import { useRouter } from "next/router";
import ProfileLayoutShell from "@/components/partials/shell/ProfileLayoutShell";
import { Tabs } from "@/components/ui/tabs";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { LayoutDashboard, Music } from "lucide-react";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";

const RivalProfileLayout = ({
  rivalUserId,
  currentTab,
  actions,
  children,
}: {
  rivalUserId: string;
  currentTab: "overview" | "scores";
  /** タブ切り替えでも消えない操作ボタン等（比較メンバー編集ボタン等、#287） */
  actions?: ReactNode;
  children: ReactNode;
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const version = (router.query.version as string) || latestVersion;

  // 比較メンバー選択(#287)はタブ切り替えでも保持する
  const compare = router.query.compare;
  const virtual = router.query.virtual;
  const comparisonParams = new URLSearchParams();
  if (typeof compare === "string" && compare) {
    comparisonParams.set("compare", compare);
  }
  if (typeof virtual === "string" && virtual) {
    comparisonParams.set("virtual", virtual);
  }
  const overviewHref = comparisonParams.size
    ? `/rivals/${rivalUserId}?${comparisonParams.toString()}`
    : `/rivals/${rivalUserId}`;

  const scoreParams = new URLSearchParams({
    difficulties: "LEGGENDARIA,HYPER,ANOTHER",
    levels: "12,11",
    isMyPlayed: "true",
    isRivalPlayed: "true",
    ...Object.fromEntries(comparisonParams),
  });

  return (
    <ProfileLayoutShell userId={rivalUserId} bannerType="rival">
      {() => (
        <Tabs value={currentTab} className="w-full">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AppTabsList visual="card" cols={2} className="sm:mb-0">
              <AppTabsTrigger
                value="overview"
                visual="card"
                icon={LayoutDashboard}
                href={overviewHref}
                iconOnly
              >
                {t("page.rival.tabOverview")}
              </AppTabsTrigger>
              <AppTabsTrigger
                value="scores"
                visual="card"
                icon={Music}
                href={`/rivals/${rivalUserId}/scores/${version}?${scoreParams.toString()}`}
                iconOnly
              >
                {t("page.rival.tabScores")}
              </AppTabsTrigger>
            </AppTabsList>
            {actions}
          </div>
          {children}
        </Tabs>
      )}
    </ProfileLayoutShell>
  );
};

export default RivalProfileLayout;
