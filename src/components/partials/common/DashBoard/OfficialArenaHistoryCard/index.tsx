import { useState } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useArenaMetadata, useOfficialArenaHistory } from "@/hooks/arena/useOfficialArenaHistory";
import { useArenaHistory } from "@/hooks/arena/useArenaHistory";
import { useActiveArenaPlayers } from "@/hooks/arena/useActiveArenaPlayers";
import OfficialArenaHistoryCardUI from "./ui";
import OfficialArenaHistoryCardSkeleton from "./skeleton";

const OfficialArenaHistorySection = ({
  userId,
  showActivePlayers = false,
}: {
  userId: string;
  showActivePlayers?: boolean;
}) => {
  const { version } = useStatsFilter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: metadata, isLoading: metaLoading } = useArenaMetadata(version);
  const selectedEvent = metadata?.events[selectedIndex] ?? null;

  const { data, isLoading: dataLoading } = useOfficialArenaHistory(userId, version, selectedEvent);
  const state = useArenaHistory(data, dataLoading, selectedEvent ?? undefined);

  // eslint-disable-next-line react-hooks/purity -- 現在時刻とイベント開催期間を比較してライブ判定するため意図的にDate.now()を都度評価している
  const now = Date.now();
  const isLive =
    !!selectedEvent &&
    now >= new Date(selectedEvent.start).getTime() &&
    now <= new Date(selectedEvent.end).getTime();
  const { data: activeData, isLoading: activeLoading } = useActiveArenaPlayers(
    metadata?.version ?? "",
    isLive,
  );

  if (metaLoading) return <OfficialArenaHistoryCardSkeleton />;

  return (
    <OfficialArenaHistoryCardUI
      metadata={metadata}
      metaLoading={metaLoading}
      selectedIndex={selectedIndex}
      onSelectIndex={setSelectedIndex}
      dataLoading={dataLoading}
      state={state}
      isLive={isLive}
      activePlayers={{ data: activeData, isLoading: activeLoading }}
      showActivePlayers={showActivePlayers}
    />
  );
};

export default OfficialArenaHistorySection;
