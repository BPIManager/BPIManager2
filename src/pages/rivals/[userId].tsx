"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useProfile } from "@/hooks/users/useProfile";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import RivalProfileLayout from "@/components/partials/features/Rivals/Layout/layout";
import RivalSongsTable from "@/components/partials/common/Rivals/Table";
import RivalPickStep from "@/components/partials/features/Rivals/PickStep";
import type { VirtualRivalKey } from "@/components/partials/features/Rivals/PickStep/types";
import MultiRivalScoreTable from "@/components/partials/features/Rivals/MultiScoreTable";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { DashBoardFilter } from "@/components/partials/common/DashBoard/Filter";
import RadarSection from "@/components/partials/common/DashBoard/Radar/ui";
import { RankDistributionSection } from "@/components/partials/common/DashBoard/DJRankDistribution";
import { BpiDistributionSection } from "@/components/partials/common/DashBoard/BPIDistribution";
import BpmBpiDistributionSection from "@/components/partials/common/DashBoard/BpmBpiDistribution";
import BpiHistorySection from "@/components/partials/common/DashBoard/TotalBPIHistory";
import IidxTowerComparisonSection from "@/components/partials/common/DashBoard/IidxTowerCard/comparison";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useRivalComparison } from "@/hooks/social/useRivalComparison";
import { WinLossStats } from "@/components/partials/common/WinLossStats";
import { useTranslation } from "@/hooks/common/useTranslation";
import { MAX_COMPARISON_MEMBERS } from "@/constants/logic/rivalComparison";

function RivalOverviewTab({
  myUserId,
  myName,
  rivalUserId,
  rivalName,
}: {
  myUserId: string;
  myName?: string;
  rivalUserId: string;
  rivalName?: string;
}) {
  const { data } = useRivalComparison(rivalUserId);
  const { t } = useTranslation();
  const winLoss = data?.compare?.winLoss;

  return (
    <div className="flex flex-col gap-6">
      <DashBoardFilter />

      {winLoss && winLoss.length > 0 && (
        <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-4 shadow-xl backdrop-blur-md">
          <WinLossStats
            winLossData={winLoss}
            viewerId={myUserId}
            rivalId={rivalUserId}
            myName={myName}
            rivalName={rivalName}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RankDistributionSection
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          myName={t("page.rival.me")}
          rivalName={rivalName}
        />
        <BpiDistributionSection
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          myName={t("page.rival.me")}
          rivalName={rivalName}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
        <BpmBpiDistributionSection
          myUserId={myUserId}
          rivalUserId={rivalUserId}
          myName={t("page.rival.me")}
          rivalName={rivalName}
        />
      </div>

      <BpiHistorySection
        myUserId={myUserId}
        rivalUserId={rivalUserId}
        myName={t("page.rival.me")}
        rivalName={rivalName}
      />

      <IidxTowerComparisonSection
        rivalUserId={rivalUserId}
        myName={t("page.rival.me")}
        rivalName={rivalName}
      />

      <RadarSection
        userId={myUserId}
        rivalUserId={rivalUserId}
        rivalName={rivalName}
      />
    </div>
  );
}

export default function RivalsUserPage({
  defaultView = "overview",
}: {
  defaultView: "overview" | "scores";
}) {
  const router = useRouter();
  const rivalUserId = router.query.userId as string;
  const version = (router.query.version as string) || latestVersion;
  const { user } = useUser();

  const { profile: rivalProfile } = useProfile(rivalUserId);
  const rivalName = rivalProfile?.userName;
  const { t } = useTranslation();

  // 複数ライバル(1:N)比較の追加メンバー・仮想指標(#287)。未選択時は
  // 従来通りの1:1表示のまま(regressionなし)。
  const [isPickStepOpen, setIsPickStepOpen] = useState(false);
  const compareIds = useMemo(() => {
    const raw = router.query.compare;
    if (typeof raw !== "string" || !raw) return [];
    // 重複・URLの主ライバル自身が紛れ込んだ場合の安全策
    return Array.from(
      new Set(raw.split(",").filter((id) => id && id !== rivalUserId)),
    );
  }, [router.query.compare, rivalUserId]);
  const virtualKeys = useMemo(() => {
    const raw = router.query.virtual;
    if (typeof raw !== "string" || !raw) return [];
    return raw
      .split(",")
      .filter((v): v is VirtualRivalKey => v === "wr" || v === "kaidenAvg");
  }, [router.query.virtual]);
  const hasExtendedComparison = compareIds.length > 0 || virtualKeys.length > 0;

  const updateComparisonQuery = (
    nextCompare: string[],
    nextVirtual: VirtualRivalKey[],
  ) => {
    const query = { ...router.query } as Record<string, string>;
    if (nextCompare.length > 0) query.compare = nextCompare.join(",");
    else delete query.compare;
    if (nextVirtual.length > 0) query.virtual = nextVirtual.join(",");
    else delete query.virtual;
    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  // 自分 + 主ライバル + 追加分がMAX_COMPARISON_MEMBERSを超えないようにする
  // (UI側の無効化に加えたサーバーとは独立の防御。APIでも別途強制する)
  const maxExtra = MAX_COMPARISON_MEMBERS - 2;

  const handleToggleSelected = (id: string) => {
    if (!compareIds.includes(id) && compareIds.length >= maxExtra) return;
    const next = compareIds.includes(id)
      ? compareIds.filter((cid) => cid !== id)
      : [...compareIds, id];
    updateComparisonQuery(next, virtualKeys);
  };

  const handleToggleVirtual = (key: VirtualRivalKey) => {
    const next = virtualKeys.includes(key)
      ? virtualKeys.filter((k) => k !== key)
      : [...virtualKeys, key];
    updateComparisonQuery(compareIds, next);
  };

  const handleBulkAddFromList = (memberIds: string[]) => {
    const next = Array.from(new Set([...compareIds, ...memberIds])).slice(
      0,
      maxExtra,
    );
    updateComparisonQuery(next, virtualKeys);
  };

  if (!rivalUserId) return null;

  if (!user) {
    return (
      <RivalProfileLayout rivalUserId={rivalUserId} currentTab={defaultView}>
        <TabsContent value="overview" className="mt-0 outline-none">
          <LoginRequiredCard />
        </TabsContent>
        <TabsContent value="scores" className="mt-0 outline-none">
          <LoginRequiredCard />
        </TabsContent>
      </RivalProfileLayout>
    );
  }

  const myUserId = user.userId;
  const myName = user.userName;

  return (
    <RivalProfileLayout
      rivalUserId={rivalUserId}
      currentTab={defaultView}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPickStepOpen(true)}
        >
          <Users className="h-3.5 w-3.5" />
          {t("rivals.pickStep.addButton")}
        </Button>
      }
    >
      <Meta
        title={rivalName ? `${rivalName} ${t("page.rival.titleSuffix")}` : t("page.rival.titleFallback")}
        noIndex
      />

      <TabsContent value="overview" className="mt-0 outline-none">
        <RivalOverviewTab
          myUserId={myUserId}
          myName={myName}
          rivalUserId={rivalUserId}
          rivalName={rivalName}
        />
      </TabsContent>

      <TabsContent value="scores" className="mt-0 outline-none">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-1 shadow-xl backdrop-blur-md overflow-hidden">
            <RivalSongsTable
              myUserId={myUserId}
              rivalUserId={rivalUserId}
              version={version}
              rivalName={rivalName}
            />
          </div>

          {hasExtendedComparison && (
            <MultiRivalScoreTable
              myUserId={myUserId}
              myName={myName}
              rivalIds={[rivalUserId, ...compareIds]}
              virtualKeys={virtualKeys}
              version={version}
            />
          )}
        </div>
      </TabsContent>

      <RivalPickStep
        open={isPickStepOpen}
        onOpenChange={setIsPickStepOpen}
        userId={myUserId}
        primaryRivalId={rivalUserId}
        selectedIds={compareIds}
        onToggleSelected={handleToggleSelected}
        virtualKeys={virtualKeys}
        onToggleVirtual={handleToggleVirtual}
        onBulkAddFromList={handleBulkAddFromList}
      />
    </RivalProfileLayout>
  );
}
