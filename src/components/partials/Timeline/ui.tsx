"use client";

import { useTimeline } from "@/hooks/social/useTimeline";
import { TimelineItem } from "./Card/ui";
import { FilterParamsFrontend } from "@/types/songs/score";
import { TimelineHeader } from "./header";
import { InfiniteScrollContainer } from "../InfiniteScroll/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

interface TimelineListProps {
  mode: "all" | "played" | "overtaken";
  params: FilterParamsFrontend;
}

export const TimelineList = ({ mode, params }: TimelineListProps) => {
  const { t } = useTranslation();
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
        emptyMessage={t("timeline.empty")}
        renderItem={(entry) => <TimelineItem key={entry.logId} entry={entry} />}
        maxH="full"
      />
    </div>
  );
};
