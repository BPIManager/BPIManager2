"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { GroupingMode, useAAATable } from "@/hooks/metrics/useAAATable";
import { latestVersion } from "@/constants/latestVersion";
import { AAATableFilter } from "@/components/partials/Metrics/AAATable/selector";
import { AAAGridItem } from "@/components/partials/Metrics/AAATable/table";

interface AAATableContentProps {
  userId: string | undefined;
  defaultVersion?: string;
}

export const AAATableContent = ({
  userId,
  defaultVersion = latestVersion,
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

  if (!userId) {
    return (
      <div className="flex h-40 items-center justify-center text-bpim-muted">
        ユーザーIDが見つかりません
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center font-bold text-bpim-danger">
        データの読み込みに失敗しました
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
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
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-bpim-text" />
        </div>
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
};
