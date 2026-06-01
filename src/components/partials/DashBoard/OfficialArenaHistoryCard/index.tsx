import { useState } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import {
  useArenaMetadata,
  useOfficialArenaHistory,
} from "@/hooks/arena/useOfficialArenaHistory";
import { OfficialArenaHistoryCardUI } from "./ui";
import { OfficialArenaHistoryCardSkeleton } from "./skeleton";

export const OfficialArenaHistorySection = ({ userId }: { userId: string }) => {
  const { version } = useStatsFilter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: metadata, isLoading: metaLoading } = useArenaMetadata(version);
  const selectedEvent = metadata?.events[selectedIndex] ?? null;

  const { data, isLoading: dataLoading } = useOfficialArenaHistory(
    userId,
    version,
    selectedEvent,
  );

  if (metaLoading) return <OfficialArenaHistoryCardSkeleton />;

  return (
    <OfficialArenaHistoryCardUI
      metadata={metadata}
      metaLoading={metaLoading}
      selectedIndex={selectedIndex}
      onSelectIndex={setSelectedIndex}
      data={data}
      dataLoading={dataLoading}
    />
  );
};
