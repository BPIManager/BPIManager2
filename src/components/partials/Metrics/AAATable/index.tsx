"use client";

import { useState } from "react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useAAATable } from "@/hooks/metrics/useAAATable";
import { GroupingMode } from "@/types/metrics/aaa";
import { latestVersion } from "@/constants/latestVersion";
import { AAATableFilter } from "@/components/partials/Metrics/AAATable/selector";
import { AAAGridItem } from "@/components/partials/Metrics/AAATable/table";
import { PageContainer, PageHeader } from "../../Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LoginRequiredCard } from "../../LoginRequired/ui";

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
  const [version, setVersion] = useState(defaultVersion);
  const [level, setLevel] = useState(12);
  const [goal, setGoal] = useState<"aaa" | "maxMinus">("aaa");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("target");

  const { groupedData, isLoading, isError } = useAAATable(
    userId,
    version,
    level,
    goal,
    groupingMode,
  );

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center font-bold text-bpim-danger">
        データの読み込みに失敗しました
      </div>
    );
  }

  const body = (
    <div className="flex w-full flex-col gap-8">
      {!userId && (
        <>
          <section className="mb-8 rounded-xl bg-bpim-surface p-6 shadow-sm border border-bpim-border">
            <h2 className="mb-4 text-xl font-bold text-bpim-text">
              💡 これは何？
            </h2>
            <p className="text-sm leading-relaxed text-bpim-muted">
              各楽曲でAAAやMAX-を達成するために必要な実力を可視化した難易度表です。
              目標スコアに対する要求BPI帯ごとに楽曲がグループ化されており、次にどの曲を狙えばよいかの指標になります。
            </p>
            <p className="mt-2 text-sm text-bpim-text">
              ログインすると、あなたの実際のスコアデータを使って達成状況を色付けできます。目標達成済みの楽曲や、目標までのスコア差分が一目でわかるようになります！
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className={cn(
                    "mt-4 rounded-full font-bold h-9",
                    "bg-bpim-primary text-bpim-bg hover:bg-bpim-primary/80",
                  )}
                >
                  ログインしてスコアを反映する
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
      />

      {isLoading ? (
        <SectionLoader className="h-64" size="xl" />
      ) : (
        <div className="flex flex-col gap-12">
          {Object.keys(groupedData)
            .sort((a, b) => Number(b) - Number(a))
            .map((bpiKey) => (
              <section key={bpiKey} className="flex flex-col gap-4">
                <div className="border-b border-bpim-border pb-1">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-bpim-muted uppercase">
                    BPI {bpiKey} ~ {Number(bpiKey) + 10}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {groupedData[Number(bpiKey)].map((item) => (
                    <AAAGridItem key={item.songId} item={item} goal={goal} />
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
