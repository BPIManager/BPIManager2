import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useRadar } from "@/hooks/stats/useRadar";
import { useSongRanking } from "@/hooks/songs/useSongRanking";
import {
  RANKING_ROW_HEIGHT,
  SongRankingListRow,
  SongRankingTableHeader,
} from "@/components/partials/Songs/SongRankingListRow";
import { RivalComparisonModal } from "@/components/partials/UserList/Modal";
import { RankingSelfRankCard, RankingVersionSelector } from "./ui";
import { RankingTabSkeleton } from "./skeleton";

interface RankingTabProps {
  songId: number;
}

export function RankingTab({ songId }: RankingTabProps) {
  const router = useRouter();
  const version = (router.query.version as string) || latestVersion;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const listRef = useRef<ListImperativeAPI>(null);

  const { fbUser } = useUser();
  const { radar: viewerRadar } = useRadar(fbUser?.uid, [], [], version);
  const { data, isLoading } = useSongRanking(songId, version);

  const selfEntry = data?.rankings.find((r) => r.isSelf);
  const selfExScore = selfEntry?.exScore;
  const showDiff = selfExScore !== undefined;

  function handleVersionChange(v: string) {
    router.push({ query: { ...router.query, version: v } }, undefined, {
      shallow: true,
    });
  }

  function handleRowClick(userId: string) {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  }

  useEffect(() => {
    if (!data || !listRef.current) return;
    const selfIndex = data.rankings.findIndex((r) => r.isSelf);
    if (selfIndex < 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToRow({ align: "center", index: selfIndex });
    }, 50);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div className="flex flex-col gap-3 mt-2">
      <RankingVersionSelector
        version={version}
        onChange={handleVersionChange}
      />

      {isLoading ? (
        <RankingTabSkeleton />
      ) : !data ? null : (
        <>
          {data.selfRank > 0 && (
            <RankingSelfRankCard
              selfRank={data.selfRank}
              totalCount={data.totalCount}
            />
          )}

          {data.rankings.length === 0 ? (
            <p className="py-8 text-center text-sm text-bpim-muted">
              まだランキングデータがありません
            </p>
          ) : (
            <div className="w-full overflow-hidden rounded-md border border-bpim-border">
              <SongRankingTableHeader showDiff={showDiff} />
              <List
                listRef={listRef}
                rowCount={data.rankings.length}
                rowHeight={RANKING_ROW_HEIGHT}
                rowComponent={SongRankingListRow}
                rowProps={{
                  rankings: data.rankings,
                  selfExScore,
                  onNavigate: handleRowClick,
                }}
                style={{ height: "40svh" }}
                className="overscroll-contain custom-scrollbar"
              />
            </div>
          )}
        </>
      )}

      <RivalComparisonModal
        rivalId={selectedUserId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewerRadar={viewerRadar ?? {}}
        version={version}
      />
    </div>
  );
}
