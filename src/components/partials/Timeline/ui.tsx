"use client";

import { useTimeline } from "@/hooks/social/useTimeline";
import { TimelineItem } from "./Card/ui";
import { FilterParamsFrontend } from "@/types/songs/score";
import { TimelineHeader } from "./header";
import { InfiniteScrollContainer } from "../InfiniteScroll/ui";
import { cn } from "@/lib/utils";

interface TimelineListProps {
  mode: "all" | "played" | "overtaken";
  params: FilterParamsFrontend;
}

export const TimelineList = ({ mode, params }: TimelineListProps) => {
  const res = useTimeline(mode, params);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-0 overflow-hidden",
        "rounded-xl border border-bpim-border bg-bpim-bg/30",
        "transition-all duration-300 shadow-xl",
      )}
    >
      <InfiniteScrollContainer
        items={res.timeline}
        setSize={res.setSize}
        isLoadingMore={res.isLoadingMore}
        isReachingEnd={res.isReachingEnd}
        header={<TimelineHeader />}
        emptyMessage="アクティビティが見つかりませんでした。フィルター条件を変えてみてください"
        renderItem={(entry) => <TimelineItem key={entry.logId} entry={entry} />}
        maxH="full"
      />
    </div>
  );
};
