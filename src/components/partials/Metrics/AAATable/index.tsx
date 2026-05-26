"use client";

import { useState, useMemo } from "react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useAAATable } from "@/hooks/metrics/useAAATable";
import { GroupingMode, GoalType, AAATableItem, CustomGoalConfig, CardDisplay } from "@/types/metrics/aaa";
import { latestVersion } from "@/constants/latestVersion";
import { AAATableFilter } from "@/components/partials/Metrics/AAATable/selector";
import { AAAGridItem } from "@/components/partials/Metrics/AAATable/table";
import { PageContainer, PageHeader } from "../../Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LoginRequiredCard } from "../../LoginRequired/ui";
import { useTranslation } from "@/hooks/common/useTranslation";

interface AAATableContentProps {
  userId: string | undefined;
  defaultVersion?: string;
  isSelf?: boolean;
}

export const AAATableContent = ({
  userId,
  defaultVersion = latestVersion,
  isSelf = true,
}: AAATableContentProps) => {
  const { t } = useTranslation();
  const [version, setVersion] = useState(defaultVersion);
  const [level, setLevel] = useState(12);
  const [goal, setGoal] = useState<GoalType>("aaa");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("target");
  const [showAbove, setShowAbove] = useState(true);
  const [showBelow, setShowBelow] = useState(true);
  const [maxDiffFilter, setMaxDiffFilter] = useState<number | undefined>(
    undefined,
  );
  const [cardDisplay, setCardDisplay] = useState<CardDisplay>("bpi");
  const [customGoal, setCustomGoal] = useState<CustomGoalConfig | null>(() => {
    try {
      const raw = localStorage.getItem("bpim2_aaa_custom_goal");
      return raw ? (JSON.parse(raw) as CustomGoalConfig) : null;
    } catch {
      return null;
    }
  });

  const handleCustomGoalChange = (config: CustomGoalConfig) => {
    setCustomGoal(config);
    localStorage.setItem("bpim2_aaa_custom_goal", JSON.stringify(config));
  };

  const customGoalRatio =
    goal === "custom" && customGoal ? customGoal.ratio : undefined;
  const customGoalOffset =
    goal === "custom" && customGoal?.type === "djRank"
      ? customGoal.offset
      : undefined;

  const { groupedData, isLoading, isError } = useAAATable(
    userId,
    version,
    level,
    goal,
    groupingMode,
    customGoalRatio,
    customGoalOffset,
  );

  const filteredGroupedData = useMemo((): Record<number, AAATableItem[]> => {
    const entries = Object.entries(groupedData).reduce<
      Record<number, AAATableItem[]>
    >((acc, [key, items]) => {
      const filtered = items.filter((item) => {
        const diff =
          goal === "custom"
            ? (item.targets.custom?.diff ?? 0)
            : item.targets[goal].diff;
        const isAbove = diff >= 0;
        if (isAbove && !showAbove) return false;
        if (!isAbove && !showBelow) return false;
        if (maxDiffFilter !== undefined && (isAbove || diff < -maxDiffFilter))
          return false;
        return true;
      });
      if (filtered.length > 0) acc[Number(key)] = filtered;
      return acc;
    }, {});
    return entries;
  }, [groupedData, goal, showAbove, showBelow, maxDiffFilter]);

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center font-bold text-bpim-danger">
        {t("aaaTable.loadError")}
      </div>
    );
  }

  const body = (
    <div className="flex w-full flex-col gap-8">
      {!userId && (
        <>
          <section className="mb-8 rounded-xl bg-bpim-surface p-6 shadow-sm border border-bpim-border">
            <h2 className="mb-4 text-xl font-bold text-bpim-text">
              {t("aaaTable.whatIsThis")}
            </h2>
            <p className="text-sm leading-relaxed text-bpim-muted">
              {t("aaaTable.whatDesc1")}
            </p>
            <p className="mt-2 text-sm text-bpim-text">
              {t("aaaTable.whatDesc2")}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className={cn(
                    "mt-4 rounded-full font-bold h-9",
                    "bg-bpim-primary text-bpim-bg hover:bg-bpim-primary/80",
                  )}
                >
                  {t("aaaTable.loginBtn")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md border-none bg-transparent p-0 shadow-none outline-none">
                <LoginRequiredCard isModal />
              </DialogContent>
            </Dialog>
          </section>
        </>
      )}
      <AAATableFilter
        version={version}
        onVersionChange={setVersion}
        level={level}
        onLevelChange={setLevel}
        goal={goal}
        onGoalChange={setGoal}
        groupingMode={groupingMode}
        onGroupingModeChange={setGroupingMode}
        showAbove={showAbove}
        onShowAboveChange={setShowAbove}
        showBelow={showBelow}
        onShowBelowChange={setShowBelow}
        maxDiffFilter={maxDiffFilter}
        onMaxDiffFilterChange={setMaxDiffFilter}
        customGoal={customGoal}
        onCustomGoalChange={handleCustomGoalChange}
        cardDisplay={cardDisplay}
        onCardDisplayChange={setCardDisplay}
      />

      {isLoading ? (
        <SectionLoader className="h-64" size="xl" />
      ) : (
        <div className="flex flex-col gap-12">
          {Object.keys(filteredGroupedData)
            .sort((a, b) => Number(b) - Number(a))
            .map((bpiKey) => (
              <section key={bpiKey} className="flex flex-col gap-4">
                <div className="border-b border-bpim-border pb-1">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-bpim-muted uppercase">
                    BPI {bpiKey} ~ {Number(bpiKey) + 10}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredGroupedData[Number(bpiKey)].map((item) => (
                    <AAAGridItem key={item.songId} item={item} goal={goal} cardDisplay={cardDisplay} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isSelf ? (
        <>
          <PageHeader
            title="AAA達成難易度表"
            description="BPIに基づくAAAまたはMAX-達成の難易度"
          />

          <PageContainer>{body}</PageContainer>
        </>
      ) : (
        body
      )}
    </>
  );
};
